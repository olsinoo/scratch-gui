import bindAll from 'lodash.bindall';
import debounce from 'lodash.debounce';
import defaultsDeep from 'lodash.defaultsdeep';
import makeToolboxXML from '../lib/make-toolbox-xml';
import PropTypes from 'prop-types';
import React from 'react';
import VMScratchBlocks from '../lib/blocks';
import VM from 'scratch-vm';

import log from '../lib/log.js';
import Prompt from './prompt.jsx';
import BlocksComponent from '../components/blocks/blocks.jsx';
import ExtensionLibrary from './extension-library.jsx';
import extensionData from '../lib/libraries/extensions/index.jsx';
import CustomProcedures from './custom-procedures.jsx';
import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import {BLOCKS_DEFAULT_SCALE, STAGE_DISPLAY_SIZES} from '../lib/layout-constants';
import DropAreaHOC from '../lib/drop-area-hoc.jsx';
import DragConstants from '../lib/drag-constants';
import defineDynamicBlock from '../lib/define-dynamic-block';

import {connect} from 'react-redux';
import {updateToolbox} from '../reducers/toolbox';
import {activateColorPicker} from '../reducers/color-picker';
// import {}
import {closeExtensionLibrary, openSoundRecorder, openConnectionModal} from '../reducers/modals';
import {activateCustomProcedures, deactivateCustomProcedures} from '../reducers/custom-procedures';
import {setConnectionModalExtensionId} from '../reducers/connection-modal';
import {updateMetrics} from '../reducers/workspace-metrics';

import {
    activateTab,
    SOUNDS_TAB_INDEX
} from '../reducers/editor-tab';
// import translatedCode from '../index';
import globalVariable from '../index.js';

const addFunctionListener = (object, property, callback) => {
    const oldFn = object[property];
    object[property] = function (...args) {
        const result = oldFn.apply(this, args);
        callback.apply(this, result);
        return result;
    };
};

const DroppableBlocks = DropAreaHOC([
    DragConstants.BACKPACK_CODE
])(BlocksComponent);

let rootBlocks = [];
let allBlocks = [];

class BlockNode {
    constructor (id, name) {
        this.id = id;
        this.opcode = name;
        this.value = null;
        this.childNode = null;
        this.parentNode = null;
        this.childID = '';
        this.parentID = '';
        this.conditionID = null;
        this.body = [];
        //this.body2 = [];
        this.isRoot = false;
    }
    toString () {
        return `${this.id}\n---> ${this.opcode}\n---> child: ${this.childNode === null ? this.childID : this.childNode.id}\n---> parent: ${this.parentNode === null ? this.parentID : this.parentNode.id}`;
    }
}

export let trees = null;

// ///////////////////////////// NEW ROOT IS ONLY WHEN BLOCK NAME STARTS WITH "event_when"
// eslint-disable-next-line no-unused-vars
class BlockTrees {
    constructor () {
        this.roots = []; // [rootNode]
        this.size = 0;
    }

    getRoots () {
        return this.roots;
    }

    findNodeByTypeInAllBlocks (opcode) {
        const foundNodes = allBlocks.filter(value => value.opcode === opcode);
        return foundNodes;
    }

    findNodeByIDInAllBlocks (id) {
        const foundNodes = allBlocks.filter(value => value.id === id);
        if (foundNodes.length === 0) return null;
        return foundNodes[0];
    }

    findNode (nodeID) {
        // find node
        for (const rootNode in this.roots) {
            let currentNode = rootNode;
            let parent = null;
            while (currentNode) {
                if (currentNode.id === nodeID) {
                    return currentNode;
                }
                parent = currentNode;
                currentNode = currentNode.childNode;
            }
        }
    }

    addNode (node) {
        // eslint-disable-next-line no-console
        console.log('ADDING node to tree: ', node.id);
        const nodes = this.roots.slice();
        if (nodes.length === 0 || node.isRoot) {
            node.childNode = this.findNodeByIDInAllBlocks(node.childID);
            this.roots.push(node);
            this.size += 1;
            return;
        }
        // for (let root in this.roots) {
        //     if (root.id === node.id) {
        //         // const foundNodes = allBlocks.filter(value => value.opcode === opcode);
        //         this.roots = this.roots.filter(rootNode => rootNode.id !== node.id);
        //     }
        // }

        this.updateNodeFamily(node);

        // let parent;
        // if (node.parentNode === null) {
        //     parent = this.findNode(node.parentID);
        // } else {
        //     parent = node.parentNode;
        // }
        if (node.parentNode === null) {
            this.roots.push(node);
            this.size += 1;
            this.checkRoots();
            return;
        }
        const parent = node.parentNode;
        // this.updateNodeFamily(parent);
        // eslint-disable-next-line no-console
        console.log('found parent: ', parent.id, parent.opcode);

        if (parent.childID === node.id) {
            // ak parent nema child node, tak sa pripne
            parent.childNode = node;
        } else {
            // if (parent.childID === '') {
            //     // nodov parent nema dieta --> body?? alebo podmienka
            // } else {
            //     // nodov parent ma dieta --> body alebo podmienka
            // }
            //
            // parent.body.push(node); // this.updateNodeFamily(node)

            // inak, bud ziadneho childa nema, alebo ma nepriameho v tele
            // ak parent ma childNode a je rozny od node

            // TODO: POTREBNE ROZDELIT NA KLASICKY BLOK A TEN S VYBEROM Z MOZNOSTI (ako GoTo)
            // DONE: parent nema dieta, tak to je _menu block a treba mu nabindovat hodnotu
            // parent nema dieta, ale moze mat v tele nieco

            const oldChild = parent.childNode;
            // TODO -------------------------
            // TODO oldchild == Null
            // Ak vkladam do BODY/BODY2, tak nema childnode
            if (oldChild === null || oldChild.id === node.id) return;
            if (node.childNode === null) {
                node.childNode = oldChild;
                node.childID = oldChild.id;
                parent.childNode = node;
                parent.childID = node.id; // TODO toto tu asi nebude kvoli next-body/body-next kolizii
            } else {
                // najdem si posledne dieta z vkladanych blokov a k nemu pripojim povodneho childa
                let someNode = node;
                while (someNode.childNode !== null) {
                    someNode = someNode.childNode;
                }
                someNode.childNode = oldChild;
                someNode.childID = oldChild.id;
                parent.childNode = node;
                parent.childID = node.id;
            }
        }

        // if (parent.childNode === null) {
        //     // ak parent nema child node, tak sa pripne
        //     parent.childNode = node;
        //     parent.childID = node.id;
        // } else {
        //     // ak parent ma childNode a je rozny od node
        //
        //     // TODO: POTREBNE ROZDELIT NA KLASICKY BLOK A TEN S VYBEROM Z MOZNOSTI (ako GoTo)
        //     // DONE: parent nema dieta, tak to je _menu block a treba mu nabindovat hodnotu
        //     // parent nema dieta, ale moze mat v tele nieco
        //
        //     const oldChild = parent.childNode;
        //     if (oldChild.id === node.id) return;
        //     if (node.childNode === null) {
        //         node.childNode = oldChild;
        //         node.childID = oldChild.id;
        //         parent.childNode = node;
        //         parent.childID = node.id;
        //     } else {
        //         // najdem si posledne dieta z vkladanych blokov a k nemu pripojim povodneho childa
        //         let someNode = node;
        //         while (someNode.childNode !== null) {
        //             someNode = someNode.childNode;
        //         }
        //         someNode.childNode = oldChild;
        //         someNode.childID = oldChild.id;
        //         parent.childNode = node;
        //         parent.childID = node.id;
        //     }
        // }
        this.size += 1;
        this.checkRoots();
    }

    updateNodeFamily (node) {
        // eslint-disable-next-line no-console
        console.log('UPDATING node in tree: ', node.id);

        if (node.childID !== '' && node.childNode === null) {
            node.childNode = this.findNodeByIDInAllBlocks(node.childID);
        }
        if (node.parentID !== '' && node.parentNode === null) {
            node.parentNode = this.findNodeByIDInAllBlocks(node.parentID);
        }
        if (node.conditionID !== null) {
            const foundNode = this.findNodeByIDInAllBlocks(node.conditionID);
            if (foundNode !== null) {
                node.value = `${foundNode.opcode.substring(foundNode.opcode.indexOf('_') + 1)}(${(foundNode.value === null) ? '' : foundNode.value})`;
            }
        }
        if (node.parentID !== '' &&
            node.parentNode !== null &&
            node.parentNode.conditionID !== node.id &&
            (node.parentNode.childID === '' ||
            node.parentNode.childID !== node.id)) {
            // console.log(`${node.id} =?= ${node.conditionID}`);
            console.log(`Add ${node.id} to body of ${node.parentNode.id}`);
            //node.parentNode.body.forEach(nnode => console.log(`.      ${nnode.id}`));
            // TODO: trochu zefektivnit toto - mohlo by to spravit problem pri mrte velkych kodoch
            if (node.parentNode.body.some(nnode => nnode.id === node.id)) return;
            node.parentNode.body.push(node);
        }
    }

    updateAll () {

        allBlocks.forEach(node => {
            // console.log(`UPDATING BLOCK: ${node.id} ${node.opcode}` );
            this.updateNodeFamily(node);
        });
    }

    checkRoots () {
        const visited = new Set();
        this.roots = this.roots.filter(rootNode => (rootNode.isRoot ? (visited.has(rootNode.id) ? false : visited.add(rootNode.id)) : false));
    }

    // addNode (node) {
    //     let nodes = this.roots.slice();
    //     while (nodes.length > 0) {
    //         let currentNode = nodes.shift();
    //         if (currentNode.id === node.parentID) {
    //             // kedze v JSON je info o parentoch a childoch, tak vzdy viem, ci je nieco pripojene k tomu bloku (ci uz je to len ID alebo uz mam cely BlockNode)
    //             if (currentNode.childNode === null) {
    //                 // ak nema ziadne chidlren (alebo next), tak to bude body (ako ma napr. if) alebo vo fields/inputs
    //                 currentNode.body.push(node);
    //             } else {
    //                 // ak tento block ma nejaky nasledujuci, tak by sa mal premazat tym novym a ten novy proste odpojit
    //                 // pokial to vsak je len ID a nezhoduje sa s ID pridavaneho Node, tak to bude field/input
    //                 if (currentNode.)
    //             }
    //         }
    //     }
    // }

    updateNode (node) {

    }
    // addChild (type, value) {
    //     const newNode = new BlockNode(type, value);
    //     if (this.root === null) {
    //         this.root = newNode;
    //     } else {
    //         // eslint-disable-next-line no-console
    //         // treba najst potrebny Node, ktory je rodicom vkladaneho
    //         // je potrebne ziskavat kod z "inputs", kde sa
    //     }
    //     this.size += 1;
    //     return newNode;
    // }

    // eslint-disable-next-line no-unused-vars
    removeNode (node) {

    }
}

export let codeFromBlocks = {};

class Blocks extends React.Component {
    constructor (props) {
        console.log('constructor');
        super(props);
        // eslint-disable-next-line no-console
        // console.log('Blocks constructor - props - something?');
        // eslint-disable-next-line no-console
        // console.log(props);
        this.VirtualMachine = props.vm;
        this.ScratchBlocks = VMScratchBlocks(props.vm);
        bindAll(this, [
            'attachVM',
            'detachVM',
            'getToolboxXML',
            'handleCategorySelected',
            'handleConnectionModalStart',
            'handleDrop',
            'handleStatusButtonUpdate',
            'handleOpenSoundRecorder',
            'handlePromptStart',
            'handlePromptCallback',
            'handlePromptClose',
            'handleCustomProceduresClose',
            'onScriptGlowOn',
            'onScriptGlowOff',
            'onBlockGlowOn',
            'onBlockGlowOff',
            'onBlockUpdate',
            'handleExtensionAdded',
            'handleBlocksInfoUpdate',
            'onTargetsUpdate',
            'onVisualReport',
            'onWorkspaceUpdate',
            'onWorkspaceMetricsChange',
            'getSaveToComputerHandler',
            'setBlocks',
            'setLocale'
        ]);
        this.ScratchBlocks.prompt = this.handlePromptStart;
        this.ScratchBlocks.statusButtonCallback = this.handleConnectionModalStart;
        this.ScratchBlocks.recordSoundCallback = this.handleOpenSoundRecorder;

        this.state = {
            prompt: null
        };
        this.onTargetsUpdate = debounce(this.onTargetsUpdate, 100);
        this.toolboxUpdateQueue = [];
    }
    componentDidMount () {
        // eslint-disable-next-line no-console
        console.log('component did mount');
        rootBlocks = [];
        trees = null;
        allBlocks = [];
        this.ScratchBlocks.FieldColourSlider.activateEyedropper_ = this.props.onActivateColorPicker;
        this.ScratchBlocks.Procedures.externalProcedureDefCallback = this.props.onActivateCustomProcedures;
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);

        const workspaceConfig = defaultsDeep({},
            Blocks.defaultOptions,
            this.props.options,
            {rtl: this.props.isRtl, toolbox: this.props.toolboxXML}
        );
        this.workspace = this.ScratchBlocks.inject(this.blocks, workspaceConfig);

        // Register buttons under new callback keys for creating variables,
        // lists, and procedures from extensions.

        const toolboxWorkspace = this.workspace.getFlyout().getWorkspace();

        const varListButtonCallback = type =>
            (() => this.ScratchBlocks.Variables.createVariable(this.workspace, null, type));
        const procButtonCallback = () => {
            this.ScratchBlocks.Procedures.createProcedureDefCallback_(this.workspace);
        };

        toolboxWorkspace.registerButtonCallback('MAKE_A_VARIABLE', varListButtonCallback(''));
        toolboxWorkspace.registerButtonCallback('MAKE_A_LIST', varListButtonCallback('list'));
        toolboxWorkspace.registerButtonCallback('MAKE_A_PROCEDURE', procButtonCallback);

        // Store the xml of the toolbox that is actually rendered.
        // This is used in componentDidUpdate instead of prevProps, because
        // the xml can change while e.g. on the costumes tab.
        this._renderedToolboxXML = this.props.toolboxXML;

        // we actually never want the workspace to enable "refresh toolbox" - this basically re-renders the
        // entire toolbox every time we reset the workspace.  We call updateToolbox as a part of
        // componentDidUpdate so the toolbox will still correctly be updated
        this.setToolboxRefreshEnabled = this.workspace.setToolboxRefreshEnabled.bind(this.workspace);
        this.workspace.setToolboxRefreshEnabled = () => {
            this.setToolboxRefreshEnabled(false);
        };

        // @todo change this when blockly supports UI events
        addFunctionListener(this.workspace, 'translate', this.onWorkspaceMetricsChange);
        addFunctionListener(this.workspace, 'zoom', this.onWorkspaceMetricsChange);

        this.attachVM();
        // Only update blocks/vm locale when visible to avoid sizing issues
        // If locale changes while not visible it will get handled in didUpdate
        if (this.props.isVisible) {
            this.setLocale();
        }
    }

    // saveBlocksToJson() {
    //
    // }

    shouldComponentUpdate (nextProps, nextState) {
        // eslint-disable-next-line no-console
        console.log('component should update');

        // TODO IMPORTANT PRINT
        // console.log('PRINTING THE BLOCKS CODE');
        const projectJson = this.props.vm.toJSON();
        // console.log(projectJson);
        const obj = JSON.parse(projectJson);

        // eslint-disable-next-line no-console
        // console.log('OBJECTS:');
        for (let i = 0; i < obj.targets.length; i++) {
            // AND IS NOT A SPRITE / or not??
            if (!obj.targets[i].isStage) {
                // eslint-disable-next-line no-console
                // console.log(obj.targets[i].name);
                // eslint-disable-next-line no-console
                // console.log('# of blocks');
                // console.log(obj.targets[i].blocks);
                // eslint-disable-next-line no-console
                // console.log(typeof obj.targets[i].blocks);
                // eslint-disable-next-line no-console
                // console.log(`Blocks: ${obj.targets[i].blocks.length}`);
                // eslint-disable-next-line no-console
                // console.log(Object.entries(obj.targets[i].blocks));
                // for (let j = 0; j < obj.targets[i].blocks.length; j++) {
                //     // eslint-disable-next-line no-console
                //     console.log('Block:');
                //     // eslint-disable-next-line no-console
                //     console.log(obj.targets[i].blocks[j].opcode);
                // }
                allBlocks = [];
                // eslint-disable-next-line no-console
                console.log(`BLOCKS from ${obj.targets[i].name}`);
                // eslint-disable-next-line no-console
                console.log(Object.entries(obj.targets[i].blocks));
                console.log('-----------------------------------------------------------');
                codeFromBlocks = {};

                if (trees === null) {
                    // eslint-disable-next-line no-console
                    console.log('Add new tree');
                    trees = new BlockTrees();
                }

                trees.roots = [];

                for (const [key, value] of Object.entries(obj.targets[i].blocks)) {
                    // eslint-disable-next-line no-console
                    // console.log(`${value.opcode} ---> ${key}           root: ${value.topLevel}`);
                    // topLevel -> has the information about the root/start of the code
                    // opcode -> the type of command
                    // fields -> value chosen from list
                    // inputs -> written value
                    // if (value.opcode.contains('repeat'))

                    let addBlockToTree = true;
                    const newBlock = new BlockNode(key, value.opcode);
                    const noOfInputs = Object.keys(value.inputs).length;
                    const noOfFields = Object.keys(value.fields).length;
                    if (noOfInputs === 0 && noOfFields === 0) {
                        // eslint-disable-next-line no-console
                        console.log(`//////////////// NO INPUTS NOR FIELDS ////////////////`);
                    } else if (noOfInputs === 0) {
                        console.log(`//////////////// NO INPUTS ////////////////`);
                        newBlock.value = value.fields[Object.keys(value.fields)[0]][0];
                        const fields = [];
                        for (let j = 0; j < noOfFields; j++) {
                            if (value.fields[Object.keys(value.fields)[j]].constructor === Array) {
                                // fields.push(value.fields[Object.keys(value.fields)[j]][0]);
                                fields.push(value.fields[Object.keys(value.fields)[j]][0].replace('_', ''));
                            } else {
                                fields.push(null);
                                console.log(`//// find block ${value.inputs[Object.keys(value.inputs)[j]][1]} and get its value ////`);
                                // this.setParentValue(newBlock.parentID, value, blockNodes);
                            }
                        }
                        // if (fields.length === 1) {
                        //     newBlock.value = fields[0];
                        // } else {
                        newBlock.value = fields;
                        // }
                    } else if (noOfFields === 0) {
                        console.log(`//////////////// NO FIELDS ////////////////`);
                        // if (noOfInputs > 1) {
                        const inputs = [];
                        for (let j = 0; j < noOfInputs; j++) {
                            console.log('inputs:');
                            console.log(value.inputs);
                            if (value.inputs[Object.keys(value.inputs)[j]][1] !== null && value.inputs[Object.keys(value.inputs)[j]][1].constructor === Array) {
                                // inputs.push(value.inputs[Object.keys(value.inputs)[j]][1][1]);
                                inputs.push(value.inputs[Object.keys(value.inputs)[j]][1][1].replace('_', ''));
                            } else {
                                if (inputs.length === 0) {
                                    inputs.push(null);
                                }
                                // console.log(value.inputs[Object.keys(value.inputs)[j]][1]); // ID
                                if (Object.keys(value.inputs)[j].toUpperCase() === 'CONDITION' || Object.keys(value.inputs)[j].toUpperCase().endsWith('MENU')) {
                                    console.log('new condition/menu');
                                    newBlock.conditionID = value.inputs[Object.keys(value.inputs)[j]][1];
                                    addBlockToTree = false;
                                }
                                console.log(`//// find block --${value.inputs[Object.keys(value.inputs)[j]][1]}-- and get its value ////`);
                                //    find corresponding block and get its value
                                // TODO IF CONDITIONS
                                // trees.updateNodeFamily(newBlock);
                                console.log('     NEEDS NO FIELDS VERSION OF VALUE SEARCH');
                                //     this.setParentValue(newBlock.parentID, value, blockNodes);
                            }
                        }
                        // if (inputs.length === 1) {
                        //     newBlock.value = inputs[0];
                        // } else {
                        newBlock.value = inputs;
                        // }
                        // } else {
                        //     newBlock.value = value.inputs[0];
                        // }
                    } else {
                        console.log(`//////////////// INPUTS AND FIELDS ////////////////`);
                        const inputFields = [];
                        for (let j = 0; j < noOfInputs; j++) {
                            if (value.inputs[Object.keys(value.inputs)[j]][1].constructor === Array) {
                                inputFields.push(value.inputs[Object.keys(value.inputs)[j]][1][1]);
                            } else {
                                inputFields.push(null);
                                console.log(`//// find block ${value.inputs[Object.keys(value.inputs)[j]][1]} and get its value ////`);
                                // this.setParentValue(newBlock.parentID, value, blockNodes);
                            }
                            // inputFields.push(value.inputs[Object.keys(value.inputs)[j]][1][1]);
                        }
                        for (let j = 0; j < noOfFields; j++) {
                            if (value.fields[Object.keys(value.fields)[j]].constructor === Array) {
                                inputFields.push(value.fields[Object.keys(value.fields)[j]][0]);
                            } else {
                                inputFields.push(null);
                                console.log(`//// find block ${value.inputs[Object.keys(value.inputs)[j]][1]} and get its value ////`);
                                // this.setParentValue(newBlock.parentID, value, blockNodes);
                            }
                            // inputFields.push(value.fields[Object.keys(value.fields)[j]][0]);
                        }
                        // if (inputFields.length === 1) {
                        //     newBlock.value = inputFields[0];
                        // } else {
                        newBlock.value = inputFields;
                        // }
                    }

                    codeFromBlocks[key] = newBlock.opcode.toString()
                        .concat(`${newBlock.value}`);
                    newBlock.childID = value.next;
                    newBlock.parentID = value.parent;
                    if (newBlock.opcode.endsWith('menu')) {
                        // blockNodes = this.setParentValue(newBlock.parentID, value, blockNodes);
                        console.log(`MENU BLOCK COMPONENT`);
                        console.log(value.fields);
                        console.log(value.fields[Object.keys(value.fields)[0]][0]);
                        const parentBlock = trees.findNodeByIDInAllBlocks(value.parent);
                        // parentBlock.value = value.fields[Object.keys(value.fields)[0]][0];
                        parentBlock.value = value.fields[Object.keys(value.fields)[0]][0].replaceAll('_', '');
                        addBlockToTree = false;
                        continue;
                        // console.log(`Update node: ${newBlock.id} in tree`);
                        // trees.updateNodeFamily(newBlock);
                    } else {
                        // eslint-disable-next-line no-console
                        console.log(`ADDING NEW BLOCK TO TRANSLATE: ${newBlock.opcode} :NOT ADDING MENU`);
                        // allBlocks.push(newBlock);
                    }

                    // if (value.topLevel && value.opcode.startsWith('event_') && !value.opcode.startsWith('event_broadcast')) {
                    //     console.log('EVENT BLOCK HANDLER is missing');
                    //     // eslint-disable-next-line no-console
                    //     // console.log('FIX LINE 433'); // who knows which one it is now
                    //     // if (trees.some(node => node.id === newBlock.id)) {
                    //     //     // eslint-disable-next-line no-console
                    //     //     console.log(`EXISTING ROOT: ${value.opcode} : ${key}`);
                    //     //     // UPDATE
                    //     // } else {
                    //     //     trees.push(newBlock);
                    //     //     // eslint-disable-next-line no-console
                    //     //     console.log(`NEW EVENT ROOT: ${value.opcode} : ${key}`);
                    //     // }
                    //
                    // } else
                    if (value.topLevel) {
                        newBlock.isRoot = true;

                        if (trees.getRoots()
                            .some(node => node.id === newBlock.id)) {
                            // eslint-disable-next-line no-console
                            console.log(`EXISTING RANDOM ROOT: ${value.opcode} : ${key}`);
                            // UPDATE
                        } else {
                            // rootBlocks.push(newBlock);
                            // eslint-disable-next-line no-console
                            console.log(`NEW RANDOM ROOT: ${value.opcode} : ${key}`);
                        }
                    } else {
                        trees.roots = trees.roots.filter(rootNode => rootNode.id !== newBlock.id);
                        newBlock.isRoot = false;
                        // DONE: check if not in rootBlocks, if yes -> remove
                    }

                    if (allBlocks.some(node => node.id === newBlock.id)) {
                        // eslint-disable-next-line no-console
                        // console.log(`EXISTING BLOCK: ${value.opcode} : ${key}`);
                        // UPDATE
                        // eslint-disable-next-line no-console
                        console.log(`Update node: ${newBlock.id} in tree`);
                        trees.updateNodeFamily(newBlock);
                    } else {
                        allBlocks.push(newBlock);
                        if (trees.getRoots().length === 0) {
                            trees.roots.push(newBlock);
                        } else {
                            // eslint-disable-next-line no-console
                            console.log(`Add new node: ${newBlock.id} to tree`);
                            if (addBlockToTree) {
                                trees.addNode(newBlock);
                            }
                        }
                        // // eslint-disable-next-line no-console
                        // console.log('+++++++++++++++++++++++++++++++');
                        // // eslint-disable-next-line no-console
                        // console.log('Trees:');
                        // // eslint-disable-next-line no-console
                        // console.log(trees);
                        // // eslint-disable-next-line no-console
                        // console.log('+++++++++++++++++++++++++++++++');
                    }
                    // // eslint-disable-next-line no-console
                    // console.log(`root blocks:`);
                    // // eslint-disable-next-line no-console
                    // console.log(rootBlocks);
                    // // eslint-disable-next-line no-console
                    // console.log(`event roots:`);
                    // // eslint-disable-next-line no-console
                    // console.log(trees.getRoots());
                    // eslint-disable-next-line no-console
                    console.log(`New block:`);
                    // eslint-disable-next-line no-console
                    console.log(newBlock.toString());
                    // if (root === null) {
                    //     root = new BlockNode(key, value.fields, value.opcode);
                    // } else if (value.parent === null) {
                    //     const oldRoot = root;
                    //     root = new BlockNode(key, value.fields, value.opcode);
                    //     root.child = oldRoot;
                    //     oldRoot.parent = root;
                    // } else {
                    //     let currentNode = root;
                    //     while (true) {
                    //         if (currentNode.id === value.parent) {
                    //
                    //         }
                    //     }
                    // }
                }

                // codeFromBlocks = blockNodes;
                // globalVariable.translatedCode = blockNodes.toString();
                // eslint-disable-next-line no-console
                console.log('ALL BLOCKS:');
                // eslint-disable-next-line no-console
                console.log(allBlocks);
            }
        }
        // // eslint-disable-next-line no-console
        // console.log(obj.targets[1]);
        // eslint-disable-next-line no-console
        console.log('END OF PRINTING');
        return (
            this.state.prompt !== nextState.prompt ||
            this.props.isVisible !== nextProps.isVisible ||
            this._renderedToolboxXML !== nextProps.toolboxXML ||
            this.props.extensionLibraryVisible !== nextProps.extensionLibraryVisible ||
            this.props.customProceduresVisible !== nextProps.customProceduresVisible ||
            this.props.locale !== nextProps.locale ||
            this.props.anyModalVisible !== nextProps.anyModalVisible ||
            this.props.stageSize !== nextProps.stageSize
        );
    }
    componentDidUpdate (prevProps) {
        // eslint-disable-next-line no-console
        console.log('component update');
        // If any modals are open, call hideChaff to close z-indexed field editors
        if (this.props.anyModalVisible && !prevProps.anyModalVisible) {
            this.ScratchBlocks.hideChaff();
        }

        // Only rerender the toolbox when the blocks are visible and the xml is
        // different from the previously rendered toolbox xml.
        // Do not check against prevProps.toolboxXML because that may not have been rendered.
        if (this.props.isVisible && this.props.toolboxXML !== this._renderedToolboxXML) {
            this.requestToolboxUpdate();
        }
        // eslint-disable-next-line no-console
        // console.log('1here');
        if (this.props.isVisible === prevProps.isVisible) {
            if (this.props.stageSize !== prevProps.stageSize) {
                // force workspace to redraw for the new stage size
                window.dispatchEvent(new Event('resize'));
            }
            return;
        }
        // eslint-disable-next-line no-console
        // console.log('2here');
        const projectJson = this.VirtualMachine.toJSON();
        // eslint-disable-next-line no-console
        console.log(projectJson);

        // eslint-disable-next-line no-console
        // console.log('3here');
        // @todo hack to resize blockly manually in case resize happened while hidden
        // @todo hack to reload the workspace due to gui bug #413
        if (this.props.isVisible) { // Scripts tab
            this.workspace.setVisible(true);
            if (prevProps.locale !== this.props.locale || this.props.locale !== this.props.vm.getLocale()) {
                // call setLocale if the locale has changed, or changed while the blocks were hidden.
                // vm.getLocale() will be out of sync if locale was changed while not visible
                this.setLocale();
            } else {
                this.props.vm.refreshWorkspace();
                this.requestToolboxUpdate();
            }

            window.dispatchEvent(new Event('resize'));
        } else {
            this.workspace.setVisible(false);
        }
        // eslint-disable-next-line no-console
        // console.log('4here');
    }
    componentWillUnmount () {
        // eslint-disable-next-line no-console
        console.log('component unmount');
        this.detachVM();
        this.workspace.dispose();
        clearTimeout(this.toolboxUpdateTimeout);
    }
    requestToolboxUpdate () {
        // eslint-disable-next-line no-console
        console.log('request toolbox update');
        clearTimeout(this.toolboxUpdateTimeout);
        this.toolboxUpdateTimeout = setTimeout(() => {
            this.updateToolbox();
        }, 0);
    }
    setLocale () {
        // eslint-disable-next-line no-console
        console.log('set locale');
        this.ScratchBlocks.ScratchMsgs.setLocale(this.props.locale);
        this.props.vm.setLocale(this.props.locale, this.props.messages)
            .then(() => {
                this.workspace.getFlyout().setRecyclingEnabled(false);
                this.props.vm.refreshWorkspace();
                this.requestToolboxUpdate();
                this.withToolboxUpdates(() => {
                    this.workspace.getFlyout().setRecyclingEnabled(true);
                });
            });
    }

    updateToolbox () {
        // eslint-disable-next-line no-console
        console.log('update toolbox');
        this.toolboxUpdateTimeout = false;

        const categoryId = this.workspace.toolbox_.getSelectedCategoryId();
        const offset = this.workspace.toolbox_.getCategoryScrollOffset();
        this.workspace.updateToolbox(this.props.toolboxXML);
        this._renderedToolboxXML = this.props.toolboxXML;

        // In order to catch any changes that mutate the toolbox during "normal runtime"
        // (variable changes/etc), re-enable toolbox refresh.
        // Using the setter function will rerender the entire toolbox which we just rendered.
        this.workspace.toolboxRefreshEnabled_ = true;

        const currentCategoryPos = this.workspace.toolbox_.getCategoryPositionById(categoryId);
        const currentCategoryLen = this.workspace.toolbox_.getCategoryLengthById(categoryId);
        if (offset < currentCategoryLen) {
            this.workspace.toolbox_.setFlyoutScrollPos(currentCategoryPos + offset);
        } else {
            this.workspace.toolbox_.setFlyoutScrollPos(currentCategoryPos);
        }

        const queue = this.toolboxUpdateQueue;
        this.toolboxUpdateQueue = [];
        queue.forEach(fn => fn());
    }

    withToolboxUpdates (fn) {
        // eslint-disable-next-line no-console
        console.log('with Toolbox update');
        // if there is a queued toolbox update, we need to wait
        if (this.toolboxUpdateTimeout) {
            this.toolboxUpdateQueue.push(fn);
        } else {
            fn();
        }
    }

    attachVM () {
        // eslint-disable-next-line no-console
        console.log('attach vm');
        this.workspace.addChangeListener(this.props.vm.blockListener);
        this.flyoutWorkspace = this.workspace
            .getFlyout()
            .getWorkspace();
        this.flyoutWorkspace.addChangeListener(this.props.vm.flyoutBlockListener);
        this.flyoutWorkspace.addChangeListener(this.props.vm.monitorBlockListener);
        this.props.vm.addListener('SCRIPT_GLOW_ON', this.onScriptGlowOn);
        this.props.vm.addListener('SCRIPT_GLOW_OFF', this.onScriptGlowOff);
        this.props.vm.addListener('BLOCK_GLOW_ON', this.onBlockGlowOn);
        this.props.vm.addListener('BLOCK_GLOW_OFF', this.onBlockGlowOff);
        this.props.vm.addListener('VISUAL_REPORT', this.onVisualReport);
        this.props.vm.addListener('workspaceUpdate', this.onWorkspaceUpdate);
        this.props.vm.addListener('targetsUpdate', this.onTargetsUpdate);
        this.props.vm.addListener('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.addListener('BLOCKSINFO_UPDATE', this.handleBlocksInfoUpdate);
        this.props.vm.addListener('PERIPHERAL_CONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.addListener('PERIPHERAL_DISCONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.addListener('BLOCK_DRAG_UPDATE', this.onBlockUpdate);
        // this.props.vm.addListener('BLOCK_DRAG_END', this.onBlockChange);
    }
    detachVM () {
        console.log('detach vm');
        this.props.vm.removeListener('SCRIPT_GLOW_ON', this.onScriptGlowOn);
        this.props.vm.removeListener('SCRIPT_GLOW_OFF', this.onScriptGlowOff);
        this.props.vm.removeListener('BLOCK_GLOW_ON', this.onBlockGlowOn);
        this.props.vm.removeListener('BLOCK_GLOW_OFF', this.onBlockGlowOff);
        this.props.vm.removeListener('VISUAL_REPORT', this.onVisualReport);
        this.props.vm.removeListener('workspaceUpdate', this.onWorkspaceUpdate);
        this.props.vm.removeListener('targetsUpdate', this.onTargetsUpdate);
        this.props.vm.removeListener('EXTENSION_ADDED', this.handleExtensionAdded);
        this.props.vm.removeListener('BLOCKSINFO_UPDATE', this.handleBlocksInfoUpdate);
        this.props.vm.removeListener('PERIPHERAL_CONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.removeListener('PERIPHERAL_DISCONNECTED', this.handleStatusButtonUpdate);
        this.props.vm.removeListener('BLOCK_DRAG_UPDATE', this.onBlockUpdate);
        // this.props.vm.removeListener('BLOCK_DRAG_END', this.onBlockChange);
    }

    updateToolboxBlockValue (id, value) {
        // eslint-disable-next-line no-console
        console.log('update toolbox block value');
        this.withToolboxUpdates(() => {
            const block = this.workspace
                .getFlyout()
                .getWorkspace()
                .getBlockById(id);
            if (block) {
                block.inputList[0].fieldRow[0].setValue(value);
            }
        });
    }

    onTargetsUpdate () {
        // eslint-disable-next-line no-console
        console.log('targets update');
        if (this.props.vm.editingTarget && this.workspace.getFlyout()) {
            ['glide', 'move', 'set'].forEach(prefix => {
                this.updateToolboxBlockValue(`${prefix}x`, Math.round(this.props.vm.editingTarget.x).toString());
                this.updateToolboxBlockValue(`${prefix}y`, Math.round(this.props.vm.editingTarget.y).toString());
            });
        }
    }
    onWorkspaceMetricsChange () { // DETECTS CHANGES IN SIZE/WIDTH OF BLOCKS
        // eslint-disable-next-line no-console
        console.log('metrics change update');
        const target = this.props.vm.editingTarget;
        if (target && target.id) {
            // Dispatch updateMetrics later, since onWorkspaceMetricsChange may be (very indirectly)
            // called from a reducer, i.e. when you create a custom procedure.
            // TODO: Is this a vehement hack?
            setTimeout(() => {
                this.props.updateMetrics({
                    targetID: target.id,
                    scrollX: this.workspace.scrollX,
                    scrollY: this.workspace.scrollY,
                    scale: this.workspace.scale
                });
            }, 0);
        }
    }

    onBlockUpdate (data) {
        console.log('on block update');
        // // // TODO want to eventually move zip creation out of here, and perhaps into scratch-storage
        // console.log('ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo onBlockUpdate function');
        // console.log(data);
        // console.log('ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo onBlockUpdate function');
        this.onWorkspaceMetricsChange();
        // this.props.vm.refreshWorkspace();
        // eslint-disable-next-line no-console,no-invalid-this
        // console.log(this.ScratchBlocks.Xml.workspaceToDom(this.workspace));
        // return true;
    }

    // onBlockChange (data) {
    //     // // // TODO want to eventually move zip creation out of here, and perhaps into scratch-storage
    //     console.log('ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo onBlockChange function');
    //     console.log(data);
    //     console.log('ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo onBlockChange function');
    //     // this.props.vm.refreshWorkspace();
    //     // this.onWorkspaceMetricsChange();
    //     // eslint-disable-next-line no-console,no-invalid-this
    //     // console.log(this.ScratchBlocks.Xml.workspaceToDom(this.workspace));
    //     // return true;
    // }


    // <SB3Downloader>{(className, downloadProjectCallback) => (
    //     // eslint-disable-next-line no-invalid-this
    //     this.getSaveToComputerHandler(downloadProjectCallback)
    // )}</SB3Downloader>;


    // =============================================================
    getSaveToComputerHandler (downloadProjectCallback) {
        console.log('get save to computer');
        downloadProjectCallback();
        // return () => {
        //     // this.props.onRequestCloseFile();
        //     downloadProjectCallback();
        //     if (this.props.onProjectTelemetryEvent) {
        //         const metadata = collectMetadata(this.props.vm, this.props.projectTitle, this.props.locale);
        //         this.props.onProjectTelemetryEvent('projectDidSave', metadata);
        //     }
        // };
    }
    // onBlockChange () {
    //     // eslint-disable-next-line no-console
    //     console.log('onBlockChange function');
    //
    //     // // eslint-disable-next-line no-console
    //     // // console.log(ScratchBlocks.Xml.workspaceToDom(this.workspace));
    //     // // eslint-disable-next-line no-console
    //     // console.log('22Aloha22');
    //     //
    //     // // ==========================
    //     // // const projectJson = this.toJSON();
    //     // //
    //     // // // TODO want to eventually move zip creation out of here, and perhaps into scratch-storage
    //     // // const zip = new JSZip();
    //     // //
    //     // // // Put everything in a zip file
    //     // // zip.file('project.json', projectJson);
    //     // // this._addFileDescsToZip(soundDescs.concat(costumeDescs), zip);
    //     // //
    //     // // return zip.generateAsync({
    //     // //     type: 'blob',
    //     // //     mimeType: 'application/x.scratch.sb3',
    //     // //     compression: 'DEFLATE',
    //     // //     compressionOptions: {
    //     // //         level: 6 // Tradeoff between best speed (1) and best compression (9)
    //     // //     }
    //     // // });
    //     // // ==========================
    //     //
    //     // // eslint-disable-next-line no-console
    //     // console.log(this.VirtualMachine);
    //     // if (typeof this.VirtualMachine !== 'undefined') {
    //     //     const projectJson = this.VirtualMachine.toJSON();
    //     //     // this.props.vm.toJSON();
    //     //     // this.state.scratchGui.vm.toJSON();
    //     //     // const zip = new JSZip();
    //     //     // zip.file('project.json', projectJson);
    //     //
    //     //     // eslint-disable-next-line no-console
    //     //     console.log(projectJson);
    //     // }
    //     //
    //     // // <SB3Downloader>{(className, downloadProjectCallback) => (
    //     // //     this.getSaveToComputerHandler(downloadProjectCallback)
    //     // // )}</SB3Downloader>
    //     // // SB3Downloader.downloadProject();
    //     // // <SB3Downloader>{(className, downloadProjectCallback) => (
    //     // //     // eslint-disable-next-line no-invalid-this
    //     // //     this.getSaveToComputerHandler(downloadProjectCallback)
    //     // // )}</SB3Downloader>;
    //     // // eslint-disable-next-line no-console
    //     // console.log('33Aloha33');
    // }
    // =============================================================

    onScriptGlowOn (data) {
        console.log('S-GLOW ON');
        this.workspace.glowStack(data.id, true);
    }
    onScriptGlowOff (data) {
        console.log('S-GLOW OFF');
        this.workspace.glowStack(data.id, false);
    }
    onBlockGlowOn (data) {
        console.log('B-GLOW ON');
        this.workspace.glowBlock(data.id, true);
    }
    onBlockGlowOff (data) {
        console.log('B-GLOW OFF');
        this.workspace.glowBlock(data.id, false);
    }
    onVisualReport (data) {
        this.workspace.reportValue(data.id, data.value);
    }
    getToolboxXML () {
        console.log('get toolbox xml');
        // eslint-disable-next-line no-console
        // console.log('------------------------------ GET TOOLBOX');
        // Use try/catch because this requires digging pretty deep into the VM
        // Code inside intentionally ignores several error situations (no stage, etc.)
        // Because they would get caught by this try/catch
        try {
            let {editingTarget: target, runtime} = this.props.vm;
            const stage = runtime.getTargetForStage();
            if (!target) target = stage; // If no editingTarget, use the stage

            const stageCostumes = stage.getCostumes();
            const targetCostumes = target.getCostumes();
            const targetSounds = target.getSounds();
            // eslint-disable-next-line no-console
            // console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx getBlocksXML');
            // eslint-disable-next-line no-console
            // console.log(this.props.vm.runtime.getBlocksXML(target));
            // eslint-disable-next-line no-console
            // console.log(target);
            const dynamicBlocksXML = this.props.vm.runtime.getBlocksXML(target);
            return makeToolboxXML(false, target.isStage, target.id, dynamicBlocksXML,
                targetCostumes[targetCostumes.length - 1].name,
                stageCostumes[stageCostumes.length - 1].name,
                targetSounds.length > 0 ? targetSounds[targetSounds.length - 1].name : ''
            );
        } catch {
            return null;
        }
    }
    onWorkspaceUpdate (data) {
        // eslint-disable-next-line no-console
        console.log('workspace update');
        // eslint-disable-next-line no-console
        // console.log(data);
        // When we change sprites, update the toolbox to have the new sprite's blocks
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }

        if (this.props.vm.editingTarget && !this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id]) {
            this.onWorkspaceMetricsChange();
        }

        // Remove and reattach the workspace listener (but allow flyout events)
        this.workspace.removeChangeListener(this.props.vm.blockListener);
        const dom = this.ScratchBlocks.Xml.textToDom(data.xml);
        try {
            this.ScratchBlocks.Xml.clearWorkspaceAndLoadFromXml(dom, this.workspace);
        } catch (error) {
            // The workspace is likely incomplete. What did update should be
            // functional.
            //
            // Instead of throwing the error, by logging it and continuing as
            // normal lets the other workspace update processes complete in the
            // gui and vm, which lets the vm run even if the workspace is
            // incomplete. Throwing the error would keep things like setting the
            // correct editing target from happening which can interfere with
            // some blocks and processes in the vm.
            if (error.message) {
                error.message = `Workspace Update Error: ${error.message}`;
            }
            log.error(error);
        }
        this.workspace.addChangeListener(this.props.vm.blockListener);

        if (this.props.vm.editingTarget && this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id]) {
            const {scrollX, scrollY, scale} = this.props.workspaceMetrics.targets[this.props.vm.editingTarget.id];
            this.workspace.scrollX = scrollX;
            this.workspace.scrollY = scrollY;
            this.workspace.scale = scale;
            this.workspace.resize();
        }

        // Clear the undo state of the workspace since this is a
        // fresh workspace and we don't want any changes made to another sprites
        // workspace to be 'undone' here.
        this.workspace.clearUndo();
    }
    handleExtensionAdded (categoryInfo) {
        console.log('extension added');
        const defineBlocks = blockInfoArray => {
            if (blockInfoArray && blockInfoArray.length > 0) {
                const staticBlocksJson = [];
                const dynamicBlocksInfo = [];
                blockInfoArray.forEach(blockInfo => {
                    if (blockInfo.info && blockInfo.info.isDynamic) {
                        dynamicBlocksInfo.push(blockInfo);
                    } else if (blockInfo.json) {
                        staticBlocksJson.push(blockInfo.json);
                    }
                    // otherwise it's a non-block entry such as '---'
                });

                this.ScratchBlocks.defineBlocksWithJsonArray(staticBlocksJson);
                dynamicBlocksInfo.forEach(blockInfo => {
                    // This is creating the block factory / constructor -- NOT a specific instance of the block.
                    // The factory should only know static info about the block: the category info and the opcode.
                    // Anything else will be picked up from the XML attached to the block instance.
                    const extendedOpcode = `${categoryInfo.id}_${blockInfo.info.opcode}`;
                    const blockDefinition =
                        defineDynamicBlock(this.ScratchBlocks, categoryInfo, blockInfo, extendedOpcode);
                    this.ScratchBlocks.Blocks[extendedOpcode] = blockDefinition;
                });
            }
        };

        // scratch-blocks implements a menu or custom field as a special kind of block ("shadow" block)
        // these actually define blocks and MUST run regardless of the UI state
        defineBlocks(
            Object.getOwnPropertyNames(categoryInfo.customFieldTypes)
                .map(fieldTypeName => categoryInfo.customFieldTypes[fieldTypeName].scratchBlocksDefinition));
        defineBlocks(categoryInfo.menus);
        defineBlocks(categoryInfo.blocks);

        // Update the toolbox with new blocks if possible
        const toolboxXML = this.getToolboxXML();
        if (toolboxXML) {
            this.props.updateToolboxState(toolboxXML);
        }
    }
    handleBlocksInfoUpdate (categoryInfo) {
        // eslint-disable-next-line no-console
        console.log('blocks info update');
        // @todo Later we should replace this to avoid all the warnings from redefining blocks.
        this.handleExtensionAdded(categoryInfo);
    }
    handleCategorySelected (categoryId) {
        // eslint-disable-next-line no-console
        console.log('category selected');
        // eslint-disable-next-line no-console
        // console.log(categoryId);
        const extension = extensionData.find(ext => ext.extensionId === categoryId);
        if (extension && extension.launchPeripheralConnectionFlow) {
            this.handleConnectionModalStart(categoryId);
        }

        this.withToolboxUpdates(() => {
            this.workspace.toolbox_.setSelectedCategoryById(categoryId);
        });
    }
    setBlocks (blocks) {
        console.log('set blocks');
        this.blocks = blocks;
    }
    handlePromptStart (message, defaultValue, callback, optTitle, optVarType) {
        console.log('prompt start');
        const p = {prompt: {callback, message, defaultValue}};
        p.prompt.title = optTitle ? optTitle :
            this.ScratchBlocks.Msg.VARIABLE_MODAL_TITLE;
        p.prompt.varType = typeof optVarType === 'string' ?
            optVarType : this.ScratchBlocks.SCALAR_VARIABLE_TYPE;
        p.prompt.showVariableOptions = // This flag means that we should show variable/list options about scope
            optVarType !== this.ScratchBlocks.BROADCAST_MESSAGE_VARIABLE_TYPE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_VARIABLE_MODAL_TITLE &&
            p.prompt.title !== this.ScratchBlocks.Msg.RENAME_LIST_MODAL_TITLE;
        p.prompt.showCloudOption = (optVarType === this.ScratchBlocks.SCALAR_VARIABLE_TYPE) && this.props.canUseCloud;
        this.setState(p);
    }
    handleConnectionModalStart (extensionId) {
        console.log('connsection modal start');
        this.props.onOpenConnectionModal(extensionId);
    }
    handleStatusButtonUpdate () {
        console.log('status button update');
        this.ScratchBlocks.refreshStatusButtons(this.workspace);
    }
    handleOpenSoundRecorder () {
        console.log('sound recorder');
        this.props.onOpenSoundRecorder();
    }

    /*
     * Pass along information about proposed name and variable options (scope and isCloud)
     * and additional potentially conflicting variable names from the VM
     * to the variable validation prompt callback used in scratch-blocks.
     */
    handlePromptCallback (input, variableOptions) {
        console.log('prompt callback');
        this.state.prompt.callback(
            input,
            this.props.vm.runtime.getAllVarNamesOfType(this.state.prompt.varType),
            variableOptions);
        this.handlePromptClose();
    }
    handlePromptClose () {
        console.log('prompt close');
        this.setState({prompt: null});
    }
    handleCustomProceduresClose (data) {
        console.log('custom procedure close');
        this.props.onRequestCloseCustomProcedures(data);
        const ws = this.workspace;
        ws.refreshToolboxSelection_();
        ws.toolbox_.scrollToCategoryById('myBlocks');
    }
    handleDrop (dragInfo) {
        console.log('handle drop');
        fetch(dragInfo.payload.bodyUrl)
            .then(response => response.json())
            .then(blocks => this.props.vm.shareBlocksToTarget(blocks, this.props.vm.editingTarget.id))
            .then(() => {
                this.props.vm.refreshWorkspace();
                this.updateToolbox(); // To show new variables/custom blocks
            });
    }
    render () {
        console.log('render');
        /* eslint-disable no-unused-vars */
        const {
            anyModalVisible,
            canUseCloud,
            customProceduresVisible,
            extensionLibraryVisible,
            options,
            stageSize,
            vm,
            isRtl,
            isVisible,
            onActivateColorPicker,
            onOpenConnectionModal,
            onOpenSoundRecorder,
            updateToolboxState,
            onActivateCustomProcedures,
            onRequestCloseExtensionLibrary,
            onRequestCloseCustomProcedures,
            toolboxXML,
            updateMetrics: updateMetricsProp,
            workspaceMetrics,
            ...props
        } = this.props;
        /* eslint-enable no-unused-vars */
        return (
            <React.Fragment>
                <DroppableBlocks
                    componentRef={this.setBlocks}
                    onDrop={this.handleDrop}
                    {...props}
                />
                {this.state.prompt ? (
                    <Prompt
                        defaultValue={this.state.prompt.defaultValue}
                        isStage={vm.runtime.getEditingTarget().isStage}
                        label={this.state.prompt.message}
                        showCloudOption={this.state.prompt.showCloudOption}
                        showVariableOptions={this.state.prompt.showVariableOptions}
                        title={this.state.prompt.title}
                        vm={vm}
                        onCancel={this.handlePromptClose}
                        onOk={this.handlePromptCallback}
                    />
                ) : null}
                {extensionLibraryVisible ? (
                    <ExtensionLibrary
                        vm={vm}
                        onCategorySelected={this.handleCategorySelected}
                        onRequestClose={onRequestCloseExtensionLibrary}
                    />
                ) : null}
                {customProceduresVisible ? (
                    <CustomProcedures
                        options={{
                            media: options.media
                        }}
                        onRequestClose={this.handleCustomProceduresClose}
                    />
                ) : null}
                <div>
                    {'hello, its me'}
                </div>
            </React.Fragment>
        );
    }
    // setParentValue (parentID, block, currentNodes) {
    //     console.log('set parent value');
    //     for (let blockNodeIndex = (currentNodes.length - 1); blockNodeIndex >= 0; blockNodeIndex--) {
    //         if (currentNodes[blockNodeIndex].id === block.parentNode) {
    //             // console.log(`FOUND PARENT: ${blockNodes[blockNodeIndex].id} <- ${value}`);
    //             for (let j = 0; j < currentNodes[blockNodeIndex].value.length; j++) {
    //                 if (currentNodes[blockNodeIndex].value[j] === null) {
    //                     currentNodes[blockNodeIndex].value[j] = block.fields[Object.keys(block.fields)[0]][0];
    //                     break;
    //                 }
    //             }
    //             // blockNodes[blockNodes.length - 1].value = value.fields[Object.keys(value.fields)[0]][0];
    //             // if (blockNodes[blockNodes.length - 1].value !== null) {
    //             //
    //             // } else {
    //             //     blockNodes[blockNodes.length - 1].value = value.fields[Object.keys(value.fields)[0]][0];
    //             // }
    //             break;
    //         }
    //     }
    //     return currentNodes;
    // }
}

Blocks.propTypes = {
    anyModalVisible: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    customProceduresVisible: PropTypes.bool,
    extensionLibraryVisible: PropTypes.bool,
    isRtl: PropTypes.bool,
    isVisible: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    messages: PropTypes.objectOf(PropTypes.string),
    onActivateColorPicker: PropTypes.func,
    onActivateCustomProcedures: PropTypes.func,
    onOpenConnectionModal: PropTypes.func,
    onOpenSoundRecorder: PropTypes.func,
    onProjectTelemetryEvent: PropTypes.func,
    onRequestCloseCustomProcedures: PropTypes.func,
    onRequestCloseExtensionLibrary: PropTypes.func,
    options: PropTypes.shape({
        media: PropTypes.string,
        zoom: PropTypes.shape({
            controls: PropTypes.bool,
            wheel: PropTypes.bool,
            startScale: PropTypes.number
        }),
        colours: PropTypes.shape({
            workspace: PropTypes.string,
            flyout: PropTypes.string,
            toolbox: PropTypes.string,
            toolboxSelected: PropTypes.string,
            scrollbar: PropTypes.string,
            scrollbarHover: PropTypes.string,
            insertionMarker: PropTypes.string,
            insertionMarkerOpacity: PropTypes.number,
            fieldShadow: PropTypes.string,
            dragShadowOpacity: PropTypes.number
        }),
        comments: PropTypes.bool,
        collapse: PropTypes.bool
    }),
    projectTitle: PropTypes.string,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired,
    toolboxXML: PropTypes.string,
    updateMetrics: PropTypes.func,
    updateToolboxState: PropTypes.func,
    vm: PropTypes.instanceOf(VM).isRequired,
    workspaceMetrics: PropTypes.shape({
        targets: PropTypes.objectOf(PropTypes.object)
    })
};

Blocks.defaultOptions = {
    zoom: {
        controls: true,
        wheel: true,
        startScale: BLOCKS_DEFAULT_SCALE
    },
    grid: {
        spacing: 40,
        length: 2,
        colour: '#ddd'
    },
    colours: {
        workspace: '#F9F9F9',
        flyout: '#F9F9F9',
        toolbox: '#FFFFFF',
        toolboxSelected: '#E9EEF2',
        scrollbar: '#CECDCE',
        scrollbarHover: '#CECDCE',
        insertionMarker: '#000000',
        insertionMarkerOpacity: 0.2,
        fieldShadow: 'rgba(255, 255, 255, 0.3)',
        dragShadowOpacity: 0.6
    },
    comments: true,
    collapse: false,
    sounds: false
};

Blocks.defaultProps = {
    isVisible: true,
    options: Blocks.defaultOptions
};

const mapStateToProps = state => ({
    anyModalVisible: (
        Object.keys(state.scratchGui.modals).some(key => state.scratchGui.modals[key]) ||
        state.scratchGui.mode.isFullScreen
    ),
    extensionLibraryVisible: state.scratchGui.modals.extensionLibrary,
    isRtl: state.locales.isRtl,
    locale: state.locales.locale,
    messages: state.locales.messages,
    toolboxXML: state.scratchGui.toolbox.toolboxXML,
    customProceduresVisible: state.scratchGui.customProcedures.active,
    workspaceMetrics: state.scratchGui.workspaceMetrics,
    projectTitle: state.scratchGui.projectTitle
});

const mapDispatchToProps = dispatch => ({
    onActivateColorPicker: callback => dispatch(activateColorPicker(callback)),
    onActivateCustomProcedures: (data, callback) => dispatch(activateCustomProcedures(data, callback)),
    onOpenConnectionModal: id => {
        dispatch(setConnectionModalExtensionId(id));
        dispatch(openConnectionModal());
    },
    onOpenSoundRecorder: () => {
        dispatch(activateTab(SOUNDS_TAB_INDEX));
        dispatch(openSoundRecorder());
    },
    onRequestCloseExtensionLibrary: () => {
        dispatch(closeExtensionLibrary());
    },
    onRequestCloseCustomProcedures: data => {
        dispatch(deactivateCustomProcedures(data));
    },
    updateToolboxState: toolboxXML => {
        dispatch(updateToolbox(toolboxXML));
    },
    updateMetrics: metrics => {
        dispatch(updateMetrics(metrics));
    }
});

export default errorBoundaryHOC('Blocks')(
    connect(
        mapStateToProps,
        mapDispatchToProps
    )(Blocks)
);
