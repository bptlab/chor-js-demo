import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Checks if a name is used for different participants.
 * @param shape
 * @param reporter {Reporter}
 */
export default function participantNameConstraint(shape, reporter) {
  // Check if it is a band shape
  if (is(shape, 'bpmn:Participant')) {
    const id = shape.businessObject.id;
    const name = shape.businessObject.name;
    const isUnique = reporter.elementRegistry.filter(elem => elem.diBand)
      .every(elem => elem.businessObject.name !== name || elem.businessObject.id === id);
    if (!isUnique) {
      reporter.warn(shape, 'Multiple different participants with same name: ' + name +
        '. Names should be unique for clarity');
    }
  }
}
