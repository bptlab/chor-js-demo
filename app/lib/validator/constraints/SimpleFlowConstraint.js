import { is } from 'bpmn-js/lib/util/ModelUtil';

import {
  getConnectedElements,
  isInitiating,
  getParticipants,
  isChoreoActivity, getNumberIncoming
} from '../util/ValidatorUtil';

/**
 * Checks the basic Choreo flow constraint. Compare 11.5.6 The Sequencing of Activities
 * @param shape
 * @param reporter
 */
export default function simpleFlowConstraint(shape, reporter) {
  if (is(shape, 'bpmn:Participant')) {
    let predecessors = getConnectedElements(shape, 'incoming', isChoreoActivity);

    if (isInitiating(shape)) {
      let participant = getParticipants(shape)[0];
      let simpleConstraint = true;
      predecessors.forEach(activityShape => {
        simpleConstraint = simpleConstraint && getParticipants(activityShape).includes(participant);
      });
      if (!simpleConstraint) {
        let potentialTimer = getConnectedElements(shape, 'incoming', e => isAbsoluteInterCatchTimerEvent(e));
        if (potentialTimer.length === getNumberIncoming(shape)) {
          return;
        }
        reporter.error(shape, 'The initiator <b>' + shape.businessObject.name + '</b> needs to be part of all directly preceding activities');
      }
    }
  }
}

function isAbsoluteInterCatchTimerEvent(shape) {
  return is(shape, 'bpmn:IntermediateCatchEvent')
    && shape.businessObject.eventDefinitions[0].$type === 'bpmn:TimerEventDefinition'
    && getTimerDefinitionType(shape.businessObject) === 'timeDate';
}

function getTimerDefinitionType(timer) {

  if (!timer) {
    return;
  }
  const timerEventDefinition = timer.eventDefinitions.find(e => is(e, 'bpmn:TimerEventDefinition'));
  timer = timerEventDefinition;
  const timeDate = timer.get('timeDate');
  if (typeof timeDate !== 'undefined') {
    return 'timeDate';
  }

  const timeCycle = timer.get('timeCycle'); // todo investigate if this is even valid for choreos
  if (typeof timeCycle !== 'undefined') {
    return 'timeCycle';
  }

  const timeDuration = timer.get('timeDuration');
  if (typeof timeDuration !== 'undefined') {
    return 'timeDuration';
  }
}
