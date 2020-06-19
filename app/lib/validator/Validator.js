import { heightOfTopBands } from 'chor-js/lib/util/BandUtil';

import {
  isChoreoActivity
} from './util/ValidatorUtil';

import eventBasedGatewayConstraint from './constraints/EventBasedGatewayConstraint';
import participantNameConstraint from './constraints/ParticipantNameConstraint';
import simpleFlowConstraint from './constraints/SimpleFlowConstraint';
import subChoreoParticipantsConstraint from './constraints/SubChoreoParticipantsConstraint';
import callChoreoParticipantsBijectivityConstraint from './constraints/CallChoreoParticipantsBijectivityConstraint';
import noCyclicCallChoreosConstraint from './constraints/NoCyclicCallChoreosConstraint';

const CONSTRAINTS = [
  eventBasedGatewayConstraint,
  participantNameConstraint,
  simpleFlowConstraint,
  subChoreoParticipantsConstraint,
  callChoreoParticipantsBijectivityConstraint,
  noCyclicCallChoreosConstraint,

];

const LEVEL = {
  WARNING: 0,
  ERROR: 1
};

const LEVEL_STRING = [
  'warning',
  'error'
];

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

Reporter.prototype.addAnnotationToShape = function(shape, annotation) {
  if (this.shapeAnnotations[shape.id]) {
    this.shapeAnnotations[shape.id].push(annotation);
  } else {
    this.shapeAnnotations[shape.id] = [ annotation ];
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

  this.annotations.forEach(annotation => this.addAnnotationToShape(
    findVisibleParent(annotation.shape),
    annotation
  ));
  Object.keys(this.shapeAnnotations).forEach(id => {
    const shape = this.elementRegistry.get(id);
    this.displayOnShape(shape, this.shapeAnnotations[id]);
  });
};

/**
 * Display a list of annotations on their shape.
 * @param annotations {Array}
 */
Reporter.prototype.displayOnShape = function(shape, annotations) {
  let childAnnotations = annotations.filter(annotation => annotation.shape !== shape);
  let parentAnnotations = annotations
    .filter(annotation => annotation.shape === shape)
    .sort((a,b) => b.level - a.level);

  const topOffset = isChoreoActivity(shape) ? heightOfTopBands(shape) : -7;
  const level = Math.max(...annotations.map(annotation => annotation.level));
  const count = annotations.length;

  let infoText = '';
  parentAnnotations.forEach(annotation => {
    infoText += '<li class="li-' + LEVEL_STRING[annotation.level] + '">' + annotation.text + '</li>';
  });
  if (childAnnotations.length > 0) {
    let errorCount = childAnnotations.filter(annotation => annotation.level === LEVEL.ERROR).length;
    let warningCount = childAnnotations.filter(annotation => annotation.level === LEVEL.WARNING).length;
    infoText += '<li class="li-note">';
    if (errorCount > 0) {
      infoText += '<b>' + errorCount + '</b> nested error';
      if (errorCount > 1) {
        infoText += 's';
      }
      if (warningCount > 0) {
        infoText += ',';
      }
    }
    if (warningCount > 0) {
      infoText += warningCount + ' nested warning';
      if (warningCount > 1) {
        infoText += 's';
      }
    }
    infoText += '</li>';
  }

  let html = '<div class="val-' + LEVEL_STRING[level] + '">';
  if (count > 1) {
    html += '<div class="validation-count">' + count + '</div>';
  }
  html += '<ul class="validation-info">' + infoText + '</ul>';
  html += '</div>';

  const newOverlayId = this.overlays.add(shape.id, {
    position: {
      top: topOffset,
      left: shape.width - 12
    },
    html: html
  });
  this.overlayIDs.push(newOverlayId);
};

Reporter.prototype.clearAll = function() {
  this.overlayIDs.forEach(id => this.overlays.remove(id));
  this.shapeAnnotations = {};
  this.annotations = [];
};
