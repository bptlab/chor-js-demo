import { is } from 'bpmn-js/lib/util/ModelUtil';

import {
  getConnectedElements,
  getInitiatingParticipants,
  participatesIn,
  isChoreoActivity
} from '../util/ValidatorUtil';

/**
 * Checks that timer can be used as relative timer. Compare 11.6.2 Intermediate Events
 * @param shape
 * @param reporter {Reporter}
 */
export default function timerEventConstraint(shape, reporter) {
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
      // Also TODO: Formulate the warning somewhat more concisely
      reporter.warn(shape, 'For relative timers: Only the Participants involved in the Choreography ' +
        'Activity that immediately precedes the Event would know the time. The sender of the Choreography Activity ' +
        'that immediately follows the timer MUST be involved ' +
        'in the Choreography Activity that immediately precedes the timer.');
    }
  }
}
