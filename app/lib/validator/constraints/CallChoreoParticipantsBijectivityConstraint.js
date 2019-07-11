import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * The mapping between the CallChoreo's participants and the participants of the called choreography should be bijective.
 * @param shape
 * @param reporter {Reporter}
 */
export default function callChoreoParticipantsBijectivityConstraint(shape, reporter) {
  if (is(shape, 'bpmn:CallChoreography') && shape.businessObject.calledChoreographyRef) {
    const callChoreoBO = shape.businessObject;
    const bandShapes = shape.bandShapes || [];
    const participantAssociations = callChoreoBO.participantAssociations || [];

    bandShapes.forEach(band => {
      const association = participantAssociations.find(p => p.outerParticipantRef === band.businessObject);
      const bandsInnerParticipant = association ? association.innerParticipantRef : undefined;
      checkFunctionProperty(band, bandsInnerParticipant, reporter);
      checkInjectivityProperty(band, bandsInnerParticipant, participantAssociations, reporter);
    });

    checkSurjectivityProperty(participantAssociations, callChoreoBO, shape, reporter);
  }
}


function checkFunctionProperty(band, bandsInnerParticipant, reporter) {
  if (!bandsInnerParticipant) {
    reporter.warn(band, '<b>' + band.businessObject.name + '</b> ' +
      'does not yet reference an inner participant');
  }
}

function checkInjectivityProperty(band, bandsInnerParticipant, participantAssociations, reporter) {
  const injectivityViolators = participantAssociations
    .filter(pa => pa.innerParticipantRef === bandsInnerParticipant && pa.outerParticipantRef !== band.businessObject)
    .map(pa => pa.outerParticipantRef);

  if (injectivityViolators.length > 0) {
    const violatorString = injectivityViolators.map(bo => bo.name).join(', ');
    reporter.warn(band, '<b>' + band.businessObject.name + '</b> references the same inner participant as <b>'
      + violatorString + '</b>');
  }
}

function checkSurjectivityProperty(participantAssociations, callChoreoBO, shape, reporter) {
  const participantCodomain = callChoreoBO.calledChoreographyRef.participants || [];
  const surjectivityViolators = participantCodomain
    .filter(p => !participantAssociations.some(a => a.innerParticipantRef === p));
  if (surjectivityViolators.length > 0) {
    const violationString = surjectivityViolators.map(bo => bo.name).join(', ');
    const calleeName = callChoreoBO.calledChoreographyRef.name || callChoreoBO.calledChoreographyRef.id;
    reporter.warn(shape,
      '<b>' + callChoreoBO.name + '</b> does not reference participants <b>'
      + violationString + '</b> of <b>' + calleeName + '</b>');
  }
}
