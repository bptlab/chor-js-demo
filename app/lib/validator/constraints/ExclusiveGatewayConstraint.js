import { is } from 'bpmn-js/lib/util/ModelUtil';
import {
  flat,
  flowHasConditionExpression,
  getConnectedElements, getOutgoingSequenceFlows, isChoreoActivity, isInitiating
} from '../util/ValidatorUtil';

function checkKnowledgeOfMessage(target, body, precedingMessageFlows, reporter, flow) {
  const initiator = target.bandShapes.filter(e => isInitiating(e))[0].businessObject;
  let knowsMessage = false;
  // If the expression has no body we do not check or warn.
  if (body) {
    for (const msgFlow of precedingMessageFlows) {
      if (msgFlow.sourceRef === initiator || msgFlow.targetRef === initiator) {
        const name = msgFlow.messageRef.name;
        if (body.indexOf(name) !== -1) {
          knowsMessage = true;
        }
      }
    }
    if (!knowsMessage) {
      reporter.error(flow, 'Participant ' + initiator.name +
        ' has not seen a message that would allow it to determine the result of this expression: ' + body);
    }
  }

}

/**
 * Checks 11.7.1. However, the standard is very un
 * @param shape
 * @param reporter {Reporter}
 */
export default function exclusiveGatewayConstraint(shape, reporter) {
  if (is(shape, 'bpmn:ExclusiveGateway')) {
    const flows = getOutgoingSequenceFlows(shape);
    const precedingActivities = getConnectedElements(shape, 'incoming',
      e => is(e, 'bpmn:StartEvent'), isChoreoActivity);
    const precedingMessageFlows = flat(precedingActivities.map(s => s.businessObject.messageFlowRef));
    for (let flow of flows) {
      if (flowHasConditionExpression(flow)) {
        const expr = flow.businessObject.conditionExpression;
        const body = expr.body;
        // Gateways may be chained, thus we have to check for the next most activities
        const connectedActivities = getNextActivities(flow);
        for (const target of connectedActivities) {
          checkKnowledgeOfMessage(target, body, precedingMessageFlows, reporter, flow);
        }
      }
    }

  }
}

function getNextActivities(sequenceFlow) {
  if (isChoreoActivity(sequenceFlow.target)) {
    return [sequenceFlow.target];
  } else {
    return getConnectedElements(sequenceFlow.target,'outgoing', isChoreoActivity);
  }

}

function checkName(flowShape) {

}

function checkExpression(flowShape) {

}


