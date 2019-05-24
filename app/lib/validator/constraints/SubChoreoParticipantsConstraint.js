import { is } from 'bpmn-js/lib/util/ModelUtil';

import {
  flat,
  isChoreoActivity
} from '../util/ValidatorUtil';

/**
 * Checks if all participants in a subchoreo are shown as bands on the subchoreo.
 * @param shape
 * @param reporter {Reporter}
 */
export default function subChoreoParticipantsConstraint(shape, reporter) {
  if (is(shape, 'bpmn:SubChoreography')) {

    const allParticipants = new Set(flat(shape.children.filter(isChoreoActivity)
      .map(act => act.bandShapes)).map(bs => bs.businessObject));
    const shownParticipants = new Set(shape.bandShapes.map(bs => bs.businessObject));
    const notShown = Array.from(allParticipants)
      .filter(part => !shownParticipants.has(part)).map(bo => bo.name);
    if (notShown.length > 0) {
      reporter.warn(shape, 'Following participants are not shown as bands: '+ notShown.join(', '));
    }

  }
}
