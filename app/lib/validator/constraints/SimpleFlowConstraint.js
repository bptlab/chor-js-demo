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
        reporter.error(shape, 'The initiator <b>' + shape.businessObject.name + '</b> needs to be part of all directly preceding activities');
      }
    }
  }
}
