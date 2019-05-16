import { is } from 'bpmn-js/lib/util/ModelUtil';

import {
  getConnectedElements,
  isInitiating,
  isChoreoActivity
} from '../util/ValidatorUtil';

/**
 * Checks rules for event-based gateways. See chapter 11.7.2
 * @param shape
 * @param reporter {Reporter}
 */
export default function eventBasedGatewayConstraint(shape, reporter) {
  if (is(shape, 'bpmn:EventBasedGateway')) {
    const following = getConnectedElements(shape, 'outgoing', isChoreoActivity);
    // TODO: Using flatmap would require a polyfill for MS-Edge. We should clean up the babel part and take care of it that way
    const senders = following.flatMap(a => a.bandShapes.filter(p => isInitiating(p)));
    const receivers = following.flatMap(a => a.bandShapes.filter(p => !isInitiating(p)));
    if (!(senders.every((s, i, a) => a[0].businessObject.id === s.businessObject.id) ||
      receivers.every((r, i, a) => a[0].businessObject.id === r.businessObject.id))) {
      reporter.error(shape, 'After an Event Based Gateway all senders or all receivers must be the same');
    }
  }
}
