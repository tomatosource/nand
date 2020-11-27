import { IBox } from './interface';
import { App } from './main';

export function setOutputDom(ele: HTMLElement, index: number, state: boolean) {
  const ioContainers = ele.querySelectorAll('.ioContainer');
  const conns = ioContainers[1].querySelectorAll('.connector');
  conns[index].className = `connector ${state ? 'on' : 'off'}`;
}

export function setInputDom(ele: HTMLElement, index: number, state: boolean) {
  const ioContainers = ele.querySelectorAll('.ioContainer');
  const conns = ioContainers[0].querySelectorAll('.connector');
  conns[index].className = `connector ${state ? 'on' : 'off'}`;
}

export function buildBoxHTML(
  app: App,
  box: IBox,
  inputs: number,
  outputs: number,
  label: string,
): HTMLElement {
  const container = newDivWithClass('box');

  const inputsContainer = newDivWithClass('ioContainer');
  for (let i = 0; i < inputs; i++) {
    const input = newDivWithClass('connector');
    inputsContainer.appendChild(input);

    input.addEventListener('click', e => {
      if (app.selectedBox == undefined || app.selectionIsInput) {
        app.clearSelection();
        app.selectedBox = box;
        app.selectedIndex = i;
        app.selectionIsInput = true;
        input.className += ' active';
        e.stopPropagation();
      } else if (!app.selectionIsInput) {
        const ok = box.addInputConnection(
          app.selectedBox,
          app.selectedIndex,
          i,
        );
        if (!ok) {
          app.clearSelection();
          app.selectedBox = box;
          app.selectedIndex = i;
          app.selectionIsInput = true;
          input.className += ' active';
          e.stopPropagation();
        }
      }
    });

    if (i < inputs - 1) {
      const spacer = newDivWithClass('connectorSpacer');
      inputsContainer.appendChild(spacer);
    }
  }

  const outputsContainer = newDivWithClass('ioContainer');
  for (let i = 0; i < outputs; i++) {
    const output = newDivWithClass('connector off');
    outputsContainer.appendChild(output);

    output.addEventListener('click', e => {
      e.stopPropagation();
      if (app.selectedBox == undefined || !app.selectionIsInput) {
        app.clearSelection();
        app.selectedBox = box;
        app.selectedIndex = i;
        app.selectionIsInput = false;
        output.className += ' active';
        e.stopPropagation();
      } else if (app.selectionIsInput) {
        const ok = app.selectedBox.addInputConnection(
          box,
          i,
          app.selectedIndex,
        );
        if (ok) {
          app.clearSelection();
        } else {
          app.clearSelection();
          app.selectedBox = box;
          app.selectedIndex = i;
          app.selectionIsInput = false;
          output.className += ' active';
          e.stopPropagation();
        }
      }
    });
  }

  container.appendChild(inputsContainer);
  container.appendChild(outputsContainer);

  return container;
}

function newDivWithClass(className: string): HTMLElement {
  const div = document.createElement('div');
  div.className = className;
  return div;
}

export function clearSelectionFromBox(
  box: IBox,
  isInput: boolean,
  selectedIndex: number,
) {
  if (!this.rendered || box.ele == undefined) {
    return;
  }
  const state = isInput
    ? box.getInputState(selectedIndex)
    : box.getOutputState(selectedIndex);
  const ioContainers = box.ele.querySelectorAll('.ioContainer');
  const conns = isInput
    ? ioContainers[0].querySelectorAll('.connector')
    : ioContainers[1].querySelectorAll('.connector');
  conns[selectedIndex].className = `connector ${state ? 'on' : 'off'}`;
}
