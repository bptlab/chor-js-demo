// import { is } from 'bpmn-js/lib/util/ModelUtil';
// import { getAllElementsOfType } from 'chor-js/lib/util/DiagramWalkerUtil';
//
// /**
//  * CallChoreographies should not reference a choreography that contains a CallChoreography that references the
//  * choreography that contains the referencing CallChoreography.
//  * @param shape
//  * @param reporter {Reporter}
//  */
// export default function noCyclicCallChoreosConstraint(shape, reporter) {
//   if (is(shape, 'bpmn:CallChoreography')) {
//     const callChoreoBO = shape.businessObject;
//     const calledChoreo = callChoreoBO.calledChoreographyRef;
//     const parentChoreography = getContainingChoreo(callChoreoBO);
//     // Todo: https://www.geeksforgeeks.org/detect-cycle-direct-graph-using-colors/
//     const potentialCycle = visit(calledChoreo, []);
//     if (potentialCycle.length > 0) {
//       const cycleString = potentialCycle.map(choreo => choreo.name ||choreo.id).join(', ');
//       reporter.warn(shape, '<b>' +callChoreoBO.name +'</b> makes a cyclic call over: <b>'+cycleString+'</b>');
//     }
//   }
// }
//
//
// function getAllCallChoreosFromChoreo(choreo){
//   if(!choreo){
//     return []
//   }
//   return getAllElementsOfType('bpmn:CallChoreography', [choreo])
// }
//
// function getContainingChoreo(businessObject) {
//   let parent = businessObject;
//   while (!is(parent, 'bpmn:Choreography')) {
//     parent = businessObject.$parent;
//   }
//   return parent;
// }