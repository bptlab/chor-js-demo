import xml from './resources/pizzaDelivery.bpmn';
import blankXml from './resources/newDiagram.bpmn';
import $ from 'jquery';
import ChoreoModeler from 'chor-js/lib/Modeler';
import Reporter from './lib/validator/Validator.js';

var modeler = new ChoreoModeler({
  container: '#canvas',
  keyboard: {
    bindTo: document
  }
});

renderModel(xml);


function renderModel(newXml) {
  modeler.setXML(newXml).then(result => {
    return modeler.displayChoreography({
      // choreoID: '_choreo1'
    });
  }).then(result => {
    modeler.get('canvas').zoom('fit-viewport');
  }).catch(error => {
    console.error('something went wrong: ', error);
  });
}

function saveSVG(done) {
  modeler.saveSVG(done);
}

function saveDiagram(done) {
  modeler.saveXML({ format: true }, function(err, xml) {
    done(err, xml);
  });
}

$(function() {
  const reporter = new Reporter(modeler);
  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');
  const validateButton = $('#js-validate');
  let isValidating = false;

  validateButton.click(e => {
    if (!isValidating) {
      isValidating = true;
      reporter.validateDiagram();
      $(e.target.parentElement).addClass('active');
      $(e.target).prop('title', 'Disable checking');
    } else {
      isValidating = false;
      reporter.clearAll();
      $(e.target.parentElement).removeClass('active');
      $(e.target).prop('title', 'Check diagram for problems');

    }
  });

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);
    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(function() {
    saveSVG(function(err, svg) {
      setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg);
    });
    saveDiagram(function(err, xml) {
      setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
    });
  }, 500);

  $('#js-new-diagram').click(function(e) {
    renderModel(blankXml);
    exportArtifacts();
  });

  $('input').change(function(e) {
    var reader = new FileReader();
    var file = document.querySelector('input[type=file]').files[0];
    reader.addEventListener('load', function() {
      const newXml = reader.result;
      renderModel(newXml);
      exportArtifacts();
    }, false);

    if (file) {
      reader.readAsText(file);
    }

  });


  exportArtifacts();
  modeler.on('commandStack.changed', exportArtifacts);
  modeler.on('commandStack.changed',function() {
    if (isValidating) {
      reporter.validateDiagram();
    }
  });
  modeler.on('import.render.complete', function() {
    if (isValidating) {
      reporter.validateDiagram();
    }
  });
});


// expose bpmnjs to window for debugging purposes
window.bpmnjs = modeler;

// helpers //////////////////////

function debounce(fn, timeout) {

  var timer;

  return function() {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(fn, timeout);
  };
}