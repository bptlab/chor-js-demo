import { heightOfTopBands } from 'chor-js/lib/util/BandUtil';

import {
  isChoreoActivity
} from './util/ValidatorUtil';

import eventBasedGatewayConstraint from './constraints/EventBasedGatewayConstraint';
import participantNameConstraint from './constraints/ParticipantNameConstraint';
import simpleFlowConstraint from './constraints/SimpleFlowConstraint';
import subChoreoParticipantsConstraint from './constraints/SubChoreoParticipantsConstraint';
import timerEventConstraint from './constraints/TimerEventConstraint';

const CONSTRAINTS = [
  eventBasedGatewayConstraint,
  participantNameConstraint,
  simpleFlowConstraint,
  subChoreoParticipantsConstraint,
  timerEventConstraint
];

const LEVEL = {
  WARNING: 0,
  ERROR: 1
};

export default function Reporter(viewer) {
  this.overlays = viewer.get('overlays');
  this.elementRegistry = viewer.get('elementRegistry');
  this.annotations = []; // List of all annotations
  this.shapeAnnotations = {}; // Mapping from shape id to annotations
  this.overlayIDs = [];
}

Reporter.prototype.validateDiagram = function() {
  this.clearAll();
  this.elementRegistry.forEach(shape => CONSTRAINTS.forEach(constraint => constraint(shape, this)));
  this.showAnnotations();
};

Reporter.prototype.addAnnotationToShape = function(annotation) {
  if (this.shapeAnnotations[annotation.shape.id]) {
    this.shapeAnnotations[annotation.shape.id].push(annotation);
  } else {
    this.shapeAnnotations[annotation.shape.id] = [ annotation ];
  }
};

Reporter.prototype.report = function(shape, level, text) {
  this.annotations.push({ level: level, text: text, shape: shape });
};

Reporter.prototype.warn = function(shape, text) {
  this.report(shape, LEVEL.WARNING, text);
};

Reporter.prototype.error = function(shape, text) {
  this.report(shape, LEVEL.ERROR, text);
};

Reporter.prototype.showAnnotations = function() {
  function findVisibleParent(shape) {
    while (shape.hidden) {
      shape = shape.parent;
    }
    return shape;
  }

  this.annotations.forEach(a => this.addAnnotationToShape(
    { level: a.level, text: a.text, shape: findVisibleParent(a.shape) }));
  Object.values(this.shapeAnnotations).forEach(annotations => this.displayOnShape(annotations));

};

/**
 * Display a list of annotations on their shape. The shape must be the same for all annotations
 * @param annotations {Array}
 */
Reporter.prototype.displayOnShape = function(annotations) {
  annotations = annotations.sort((a,b) => a.level + b.level);
  const shape = annotations[0].shape;
  const annotationCount = annotations.length;
  const annotationType = annotations.reduce((acc, warn) => acc + warn.level, 0) / annotationCount > 0 ? 'error' : 'warning';

  function createInfoText(annotations) {
    return annotations.map(a => {
      const type = a.level > 0 ? 'error' : 'warning';
      return '<li class=li-' + type + '>' + a.text + '</li>';
    }).reduce((p, c) => p + '\n' + c, '');
  }

  const topOffset = isChoreoActivity(shape) ? heightOfTopBands(shape) : -7;
  const infoText = createInfoText(annotations);
  const newOverlayId = this.overlays.add(shape.id, {
    position: {
      top: topOffset,
      left: -12
    },

    html: '<div class="val-' + annotationType + '">' +
      '<div class="validation-count">' + annotationCount + '</div>' +
      '<ul class="validation-info">' + infoText + '</ul>' +
      '</div>'
  });
  this.overlayIDs.push(newOverlayId);
};

Reporter.prototype.clearAll = function() {
  this.overlayIDs.forEach(id => this.overlays.remove(id));
  this.shapeAnnotations = {};
  this.annotations = [];
};
