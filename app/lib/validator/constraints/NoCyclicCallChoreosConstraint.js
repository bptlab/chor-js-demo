import { is } from 'bpmn-js/lib/util/ModelUtil';
import { getAllElementsOfType } from 'chor-js/lib/util/DiagramWalkerUtil';

/**
 * Call choreographies might lead to cyclic calls. This can be viable, but a warning should be issued as this
 * can lead to infinite recursions.
 *
 * @param shape
 * @param reporter {Reporter}
 */
export default function noCyclicCallChoreosConstraint(shape, reporter) {
  if (is(shape, 'bpmn:CallChoreography')) {
    const callChoreoBO = shape.businessObject;
    const calledChoreo = callChoreoBO.calledChoreographyRef;
    const parentChoreography = getContainingChoreo(callChoreoBO);
    const cycles = dfs(calledChoreo, [parentChoreography], [callChoreoBO.name]);

    for (const cycle of cycles) {
      const nodes = cycle.nodes;
      const edges = cycle.edges;
      const cycleString = nodes.map(choreo => (choreo.name || choreo.id))
        .map((name,i) => {
          if (i < edges.length) {
            return name + ' -[' + edges[i] + ']-> ';
          }
          return name;
        }).join('');
      reporter.warn(shape,
        '<b>' +callChoreoBO.name +'</b> is part of a cyclic call via:<br><i>'+cycleString+'</i>');
    }
  }
}

/**
 * Do a depth first search starting at node.
 * @param node {BusinessObject} Called Choreo to investigate
 * @param nodePath {Array}
 * @param edgePath {Array}
 * @return cycles {Array} Elementary cycles that include the node
 */
function dfs(node, nodePath, edgePath) {
  nodePath = nodePath.concat([node]);
  const outgoingEdges = getAllCallChoreosFromChoreo(node);
  let cycles = [];
  for (let edge of outgoingEdges) {
    let target = edge.calledChoreographyRef;
    if (nodePath.indexOf(target) === -1) {
      cycles = cycles.concat(dfs(target, nodePath, edgePath.concat([edge.name])));
    } else {
      if (target === nodePath[0]) {
        cycles = cycles.concat([{ nodes: nodePath.concat([target]), edges: edgePath.concat([edge.name]) }]);
      }
    }
  }
  return cycles;
}

function getAllCallChoreosFromChoreo(choreo) {
  if (!choreo) {
    return [];
  }
  return getAllElementsOfType('bpmn:CallChoreography', [choreo]);
}

function getContainingChoreo(businessObject) {
  let parent = businessObject;
  while (!is(parent, 'bpmn:Choreography')) {
    parent = businessObject.$parent;
  }
  return parent;
}