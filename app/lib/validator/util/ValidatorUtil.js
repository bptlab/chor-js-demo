import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Get connected elements
 * @param shape The shape to start from
 * @param direction 'incoming' || 'outgoing' if to check connected shapes from incoming or outgoing
 * @param hasRequiredType {function} function to determine type of connected elements
 * @param collectElement {function}
 * @returns {Array}
 */
export function getConnectedElements(shape, direction, hasRequiredType, collectElement) {
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
  let collected = [];

  function track(nodeShape, direction) {
    const flowDirection = direction === 'incoming' ? 'source' : 'target';
    // avoid loops
    if (visited.includes(nodeShape)) {
      return;
    }
    visited.push(nodeShape);
    if (collectElement && collectElement(nodeShape)) {
      collected.push(nodeShape);
    }

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
  if (collectElement) {
    return collected;
  }
  return connected;
}

export function getParticipants(shape) {
  if (is(shape, 'bpmn:Participant')) {
    return [shape.businessObject];
  }

  if (is(shape, 'bpmn:ChoreographyActivity')) {
    return shape.bandShapes.map(bandShape => bandShape.businessObject);
  }

  return [];
}

export function isInitiating(shape) {
  if (is(shape, 'bpmn:Participant')) {
    return !shape.diBand.participantBandKind.endsWith('non_initiating');
  }
  return false;
}

export function getInitiatingParticipants(shapes) {
  return flat(shapes.filter(s => isChoreoActivity(s))
    .map(act => act.bandShapes)).filter(part => isInitiating(part));
}

export function isChoreoActivity(shape) {
  return is(shape, 'bpmn:ChoreographyActivity');
}

export function getTimerDefinitionType(shape) {
  const def = shape.businessObject.eventDefinitions[0];
  if (def.timeDate) {
    return 'timeDate';
  } else if (def.timeDuration) {
    return 'timeDuration';
  } else if (def.timeCycle) {
    return 'timeCycle';
  }
}

export function isIntermediateTimerCatchEvent(shape) {
  return is(shape, 'bpmn:IntermediateCatchEvent')
    && shape.businessObject.eventDefinitions[0].$type === 'bpmn:TimerEventDefinition';
}

export function participatesIn(participant, shape) {
  return getParticipants(shape).includes(participant);
}

export function getNumberIncoming(shape) {
  return getConnectedElements(shape, 'incoming', e => is(e, 'bpmn:FlowNode')).length;
}

export function getOutgoingSequenceFlows(shape) {
  return shape.outgoing.filter(s => is(s, 'bpmn:SequenceFlow'));
}

export function flowHasConditionExpression(shape) {
  return !!shape.businessObject.conditionExpression;
}

export function getMessageFlows(reporter) {
  return reporter.elementRegistry.filter(e => e.type ==='bpmn:Choreography')[0].businessObject.messageFlows;
}

/**
 * Stand-in function for flattening a array of depth 1.
 * @param {Array} array
 * @returns {Array}
 */
export function flat(array) {
  // Todo: Replace this with the real flat or flatMap when we have an updated
  // build pipeline which allows polyfills.
  return array.reduce((acc, value) => acc.concat(value), []);
}
