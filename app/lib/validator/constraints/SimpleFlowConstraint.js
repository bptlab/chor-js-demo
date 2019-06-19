import { is } from 'bpmn-js/lib/util/ModelUtil';

import {
  getConnectedElements,
  isInitiating,
  getParticipants,
  isChoreoActivity
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
        reporter.error(shape, 'The initiator <b>' + shape.businessObject.name + '</b> needs to be part of all directly preceding activities');
      }
    }
  }
}
