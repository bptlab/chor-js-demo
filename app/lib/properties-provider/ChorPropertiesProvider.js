import BpmnPropertiesProvider from 'bpmn-js-properties-panel/lib/provider/bpmn/BpmnPropertiesProvider.js';
import inherits from 'inherits';
import { is } from 'bpmn-js/lib/util/ModelUtil';

export default function ChorPropertiesProvider(injector) {

  injector.invoke(BpmnPropertiesProvider, this);

  const superGetTabs = this.getTabs;

  this.getTabs = function(element) {
    let generalTab = superGetTabs.call(this, element);


    if (is(element, 'bpmn:Event')) {
      // Conditional Events show Camunda specific options, we have to filter those
      if (element.businessObject.eventDefinitions) {
        const definition = element.businessObject.eventDefinitions[0];
        if (definition.$type === 'bpmn:ConditionalEventDefinition') {
          generalTab[0].groups.filter(g => g.id === 'details')[0].entries = [];
        }
      }
    }
    return generalTab;
  };

}
inherits(ChorPropertiesProvider, BpmnPropertiesProvider);
ChorPropertiesProvider.$inject = ['injector'];

