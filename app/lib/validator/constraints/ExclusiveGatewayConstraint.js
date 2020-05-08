import { is } from 'bpmn-js/lib/util/ModelUtil';
import {
  flat,
  flowHasConditionExpression,
  getConnectedElements, getMessageFlows,
  getOutgoingSequenceFlows, getParticipants, isInitiating,
} from '../util/ValidatorUtil';

/**
 * Checks 11.7.1
 * @param shape
 * @param reporter {Reporter}
 */
export default function exclusiveGatewayConstraint(shape, reporter) {
  if (is(shape, 'bpmn:ExclusiveGateway')) {
    const flows = getOutgoingSequenceFlows(shape);
    for(let flow of flows){
      if(flowHasConditionExpression(flow)){
        const expr = flow.businessObject.conditionExpression;
        const body = expr.body;
        const target = flow.target;
        const initiator = target.bandShapes.filter(e => isInitiating(e))[0];
        const messageFlow = getMessageFlows(reporter)
        debugger;

      }
    }
    debugger;
  }
}

function checkName(flowShape) {

}

function checkExpression(flowShape) {

}


