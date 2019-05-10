import { is } from 'bpmn-js/lib/util/ModelUtil';
import { heightOfTopBands } from 'chor-js/lib/util/BandUtil';

const level = { warning: 0, error: 1 };
/**
 * Get connected Choreo Activities
 * @param shape
 * @param direction 'incoming' || 'outgoing'
 * @param hasRequiredType {function}
 * @returns {Array}
 */
function getConnectedElements(shape, direction, hasRequiredType) {
  if (direction !== 'incoming' && direction !== 'outgoing') {
    // This would currently reload the page due to debounce perhaps?
    throw new Error('Illegal Argument: ' + direction);
  }
  if (is(shape, 'bpmn:Participant')) {
    shape = shape.parent;
  }

  if (!is(shape, 'bpmn:FlowNode')) {
    return [];
  }

  let visited = [];
  let connected = [];

  function track(nodeShape, direction) {
    const flowDirection = direction === 'incoming' ? 'source': 'target';
    // avoid loops
    if (visited.includes(nodeShape)) {
      return;
    }
    visited.push(nodeShape);

    // add to connected if we have reached an activity
    if (shape !== nodeShape && hasRequiredType(nodeShape)) {
      connected.push(nodeShape);
      return;
    }

    // iterate through all incoming or outgoing sequence flows and
    // recurse into the sources or targets
    nodeShape[direction].forEach(flow => {
      track(flow[flowDirection], direction);
    });
  }

  track(shape, direction);
  return connected;
}



function getParticipants(shape) {
  if (is(shape, 'bpmn:Participant')) {
    return [shape.businessObject];
  }

  if (is(shape, 'bpmn:ChoreographyActivity')) {
    return shape.bandShapes.map(bandShape => bandShape.businessObject);
  }

  return [];
}


function isInitiating(shape) {
  if (is(shape, 'bpmn:Participant')) {
    return !shape.diBand.participantBandKind.endsWith('non_initiating');
  }
  return false;
}

function getInitiatingParticipants(shapes) {
  return shapes.filter(s => isChoreoActivity(s))
    .flatMap(act => act.bandShapes).filter(part => isInitiating(part));
}

function isChoreoActivity(shape) {
  return is(shape, 'bpmn:ChoreographyActivity');
}

function simpleFlowConstraint(shape, reporter) {
  if (is(shape, 'bpmn:Participant')) {
    let predecessors = getConnectedElements(shape, 'incoming', isChoreoActivity);

    if (isInitiating(shape)) {
      let participant = getParticipants(shape)[0];
      let simpleConstraint = true;
      predecessors.forEach(activityShape => {
        simpleConstraint = simpleConstraint && getParticipants(activityShape).includes(participant);
      });
      if (!simpleConstraint) {
        console.warn('add overlay');
        reporter.report(shape, level.error, 'The initiator ' + shape.businessObject.name + ' is not part of the preceding Activity.');
      }
    }
  }
}

function participatesIn(participant, shape) {
  return getParticipants(shape).includes(participant);
}

/**
 *
 * @param shape
 * @param reporter {Reporter}
 */
function intermediateTimerCatchEvent(shape, reporter) {
  function isInterCatchTimerEvent(shape) {
    return is(shape, 'bpmn:IntermediateCatchEvent')
    && shape.businessObject.eventDefinitions[0].$type === 'bpmn:TimerEventDefinition';
  }
  if (isInterCatchTimerEvent(shape)) {
    const previousActivities = getConnectedElements(shape, 'incoming', isChoreoActivity);
    const followingActivities = getConnectedElements(shape, 'outgoing', isChoreoActivity);
    if (!getInitiatingParticipants(followingActivities)
      .every(part => previousActivities.every(act => participatesIn(part.businessObject, act)))) {
      // Currently it is not possible to distinguish between relative and absolute timers, thus this waring is not precise
      reporter.report(shape,level.warning, 'For relative timers: Only the Participants involved in the Choreography ' +
        'Activity that immediately precedes the Event would know the time. The sender of the Choreography Activity ' +
        'that immediately follows the timer MUST be involved ' +
        'in the Choreography Activity that immediately precedes the timer.');
    }


  }
}



/**
 *
 * @param shape
 * @param reporter {Reporter}
 */
function eventBasedGateway(shape, reporter) {
  if (is(shape, 'bpmn:EventBasedGateway')) {
    const following = getConnectedElements(shape, 'outgoing', isChoreoActivity);
    // TODO: Using flatmap would require a polyfill for MS-Edge. We should clean up the babel part and take care of it that way
    const senders = following.flatMap(a => a.bandShapes.filter(p => isInitiating(p)));
    const receivers = following.flatMap(a => a.bandShapes.filter(p => !isInitiating(p)));
    if (!(senders.every((s, i,a) => a[0].businessObject.id === s.businessObject.id) ||
      receivers.every((r,i,a) => a[0].businessObject.id === r.businessObject.id))) {
      reporter.report(shape,level.error, 'After an Event Based Gateway all senders or all receivers must be the same');
    }
  }
}


export default function Reporter(viewer) {
  this.overlays = viewer.get('overlays');
  this.elementRegistry = viewer.get('elementRegistry');
  this.annotations = [];
  this.shapeAnnotations = {};
  this.overlayIDs = [];
}

Reporter.prototype.validateDiagram = function() {
  this.clearAll();
  const rules = [simpleFlowConstraint, eventBasedGateway, intermediateTimerCatchEvent];
  this.elementRegistry.forEach(shape => rules.forEach(rule => rule(shape, this)));
  this.showAnnotations();
};

Reporter.prototype.addAnnotationToShape = function(annotation) {
  if (this.shapeAnnotations[annotation.shape.id]) {
    this.shapeAnnotations[annotation.shape.id].push(annotation);
  } else {
    this.shapeAnnotations[annotation.shape.id] = [annotation];
  }
};

Reporter.prototype.report = function(shape, level, text) {
  this.annotations.push({ level: level, text: text, shape: shape });
};

Reporter.prototype.showAnnotations = function() {
  function findVisibleParent(shape) {
    while (shape.hidden) {
      shape = shape.parent;
    }
    return shape;
  }
  this.annotations.forEach(a => this.addAnnotationToShape(
    { level: a.level, text: a.text, shape: findVisibleParent(a.shape) }));
  Object.values(this.shapeAnnotations).forEach(annotations => this.displayOnShape(annotations));

};

Reporter.prototype.displayOnShape = function(annotations) {
  const shape = annotations[0].shape;
  const annotationCount = annotations.length;
  const annotationType = annotations.reduce((acc,warn)=> acc + warn.level, 0)/annotationCount > 0 ? 'error':'warning';

  function createInfoText(annotations) {
    return annotations.map(a => {
      const type = a.level > 0 ? 'error':'warning';
      return '<li class=li-'+type+'>'+a.text+'</li>';
    }).reduce((p,c)=> p + '\n' + c, '');
  }
  const topOffset = isChoreoActivity(shape)? heightOfTopBands(shape) : -7;
  const infoText = createInfoText(annotations);
  const newOverlayId = this.overlays.add(shape.id, {
    position: {
      top: topOffset,
      left: -7
    },

    html: '<div class="val-'+annotationType+'">' +
      '<div class="validation-count">'+ annotationCount +'</div>' +
      '<ul class="validation-info">' + infoText +'</ul>' +
      '</div>'
  });
  this.overlayIDs.push(newOverlayId);
};

Reporter.prototype.clearAll = function() {
  this.overlayIDs.forEach(id => this.overlays.remove(id));
  this.shapeAnnotations = {};
  this.annotations = [];
};

