import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab_drag_n_drop_path extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_drag_n_drop_path:plugin',
  description: 'Jupyterlab extension to allow file or folder to be dragged-and-dropped to terminal. And to turn into a path. And if the terminal is a python file or not a terminal but python notebook - it would be turned either into path again (default) or to Pathlib expression (depending on the config in the settings)',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab_drag_n_drop_path is activated!');
  }
};

export default plugin;
