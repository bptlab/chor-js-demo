import { is } from 'bpmn-js/lib/util/ModelUtil';

import {
  getConnectedElements,
  isInitiating,
  isChoreoActivity,
  flat
} from '../util/ValidatorUtil';

/**
 * Checks rules for event-based gateways. See chapter 11.7.2
 * @param shape
 * @param reporter {Reporter}
 */
export default function eventBasedGatewayConstraint(shape, reporter) {
  if (is(shape, 'bpmn:EventBasedGateway')) {
    const following = getConnectedElements(shape, 'outgoing', isChoreoActivity);
    const senders = flat(following.map(a => a.bandShapes.filter(p => isInitiating(p))));
    const receivers = flat(following.map(a => a.bandShapes.filter(p => !isInitiating(p))));
    if (!(senders.every((s, i, a) => a[0].businessObject.id === s.businessObject.id) ||
      receivers.every((r, i, a) => a[0].businessObject.id === r.businessObject.id))) {
      reporter.error(shape, 'After an event-based gateway, all senders or all receivers must be the same');
    }
  }
}
