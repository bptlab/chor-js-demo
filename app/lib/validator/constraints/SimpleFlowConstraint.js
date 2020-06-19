import { is } from 'bpmn-js/lib/util/ModelUtil';

import {
  getConnectedElements,
  isInitiating,
  getParticipants,
  isChoreoActivity,
  isIntermediateTimerCatchEvent,
  getTimerDefinitionType
} from '../util/ValidatorUtil';

/**
 * Checks the basic sequence flow constraint.
 * Compare with Chapter "11.5.6 The Sequencing of Activities" in the BPMN standard.
 *
 * @param shape
 * @param reporter
 */
export default function simpleFlowConstraint(shape, reporter) {
  if (is(shape, 'bpmn:Participant')) {
    if (isInitiating(shape)) {
      const participant = shape.businessObject;

      // Get all relevant predecessors. We also stop traversing the model once we encounter
      // an absolute timer intermediate catch event, since those suspend the simple flow
      // constraint (see p. 341 in the standard).
      const predecessors = getConnectedElements(shape, 'incoming', e => {
        return isChoreoActivity(e) || (
          isIntermediateTimerCatchEvent(e) &&
          getTimerDefinitionType(e) === 'timeDate'
        );
      }).filter(isChoreoActivity);

      // For the remaining choreography tasks, check whether they include this participant.
      let simpleConstraint = true;
      predecessors.forEach(e => {
        simpleConstraint = simpleConstraint && getParticipants(e).includes(participant);
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
