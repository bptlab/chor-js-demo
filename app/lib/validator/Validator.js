import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

function getPredecessors(shape) {
  if (is(shape, 'bpmn:Participant')) {
    shape = shape.parent;
  }

  if (!is(shape, 'bpmn:FlowNode')) {
    return [];
  }

  let visited = [];
  let predecessors = [];

  function backtrack(nodeShape) {
    // avoid loops
    if (visited.includes(nodeShape)) {
      return;
    }
    visited.push(nodeShape);

    // add to predecessors if we have reached an activity
    if (shape !== nodeShape && is(nodeShape, 'bpmn:ChoreographyActivity')) {
      predecessors.push(nodeShape);
      return;
    }

    // iterate through all incoming sequence flows and
    // recurse into the sources
    nodeShape.incoming.forEach(flow => {
      backtrack(flow.source);
    });
  }

  backtrack(shape);
  return predecessors;
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
    let predecessors = getPredecessors(shape);
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

class Reporter {
  constructor(overlays) {
    this.overlays = overlays;
  }
  report(shape, level) {
    this.overlays.add(shape.id, {
      position: {
        top: 0,
        left: 0
      },
      html: '<div class="diagram-note">❌</div>'
    });
  }
}

export default function validate(viewer) {
  let overlays = viewer.get('overlays');
  let canvas = viewer.get('canvas');
  let elementRegistry = viewer.get('elementRegistry');
  const reporter = new Reporter(overlays);
  const rules = [simpleFlowConstraint];
  elementRegistry.forEach(shape => rules.forEach(rule => rule(shape, reporter)));
}