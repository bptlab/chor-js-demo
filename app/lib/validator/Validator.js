import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

/**
 * Get connected Choreo Activities
 * @param shape
 * @param direction 'incoming' || 'outgoing'
 * @returns {Array}
 */
function getConnected(shape, direction) {
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
    if (shape !== nodeShape && is(nodeShape, 'bpmn:ChoreographyActivity')) {
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

function simpleFlowConstraint(shape, reporter) {
  if (!shape.hidden && is(shape, 'bpmn:Participant')) {
    let predecessors = getConnected(shape, 'incoming');
    console.log(shape, predecessors);

    if (isInitiating(shape)) {
      let participant = getParticipants(shape)[0];
      let simpleConstraint = true;
      predecessors.forEach(activityShape => {
        simpleConstraint = simpleConstraint && getParticipants(activityShape).includes(participant);
      });
      if (!simpleConstraint) {
        console.warn('add overlay');
        reporter.report(shape);
      }
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
    const following = getConnected(shape, 'outgoing');
    // TODO: Using flatmap would require a polyfill for MS-Edge. We should clean up the babel part and take care of it that way
    const senders = following.flatMap(a => a.bandShapes.filter(p => isInitiating(p)));
    const receivers = following.flatMap(a => a.bandShapes.filter(p => !isInitiating(p)));
    if (!(senders.every((s, i,a) => a[0].businessObject.id === s.businessObject.id) ||
      receivers.every((r,i,a) => a[0].businessObject.id === r.businessObject.id))) {
      reporter.report(shape,2, 'After an Event Based Gateway all senders or all receivers must be the same');
    }
    debugger;
  }
}

class Reporter {
  constructor(overlays) {
    this.overlays = overlays;
    this.warnings = [];
  }
  report(shape, level, text) {
    this.warnings.push({ id: shape.id, shape: shape, level: level, text: text });
    this.overlays.add(shape.id, {
      position: {
        top: 0,
        left: 0
      },
      html: '<div title="This is my tooltip" class="diagram-note" >❌ </div>'
    });
  }
  clearAll() {
    this.warnings.forEach(warning => this.overlays.remove(warning.id));
    this.warnings = [];
  }
}

export default function validate(viewer) {
  let overlays = viewer.get('overlays');
  let canvas = viewer.get('canvas');
  let elementRegistry = viewer.get('elementRegistry');
  const reporter = new Reporter(overlays);
  const rules = [simpleFlowConstraint, eventBasedGateway];
  elementRegistry.forEach(shape => rules.forEach(rule => rule(shape, reporter)));
  return reporter;
}