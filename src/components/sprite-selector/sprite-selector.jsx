import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import Box from '../box/box.jsx';
import SpriteInfo from '../../containers/sprite-info.jsx';
import SpriteList from './sprite-list.jsx';
import ActionMenu from '../action-menu/action-menu.jsx';
import {STAGE_DISPLAY_SIZES} from '../../lib/layout-constants';
import {isRtl} from 'scratch-l10n';
import {trees, parseJsonObject} from '../../containers/blocks.jsx';
import styles from './sprite-selector.css';

import fileUploadIcon from '../action-menu/icon--file-upload.svg';
import paintIcon from '../action-menu/icon--paint.svg';
import spriteIcon from '../action-menu/icon--sprite.svg';
import surpriseIcon from '../action-menu/icon--surprise.svg';
import searchIcon from '../action-menu/icon--search.svg';
import {returns} from 'web-audio-test-api/lib/decorators/methods';
import {output} from 'scratch-audio/webpack.config';
import * as events from 'events';

const messages = defineMessages({
    addSpriteFromLibrary: {
        id: 'gui.spriteSelector.addSpriteFromLibrary',
        description: 'Button to add a sprite in the target pane from library',
        defaultMessage: 'Choose a Sprite'
    },
    addSpriteFromPaint: {
        id: 'gui.spriteSelector.addSpriteFromPaint',
        description: 'Button to add a sprite in the target pane from paint',
        defaultMessage: 'Paint'
    },
    addSpriteFromSurprise: {
        id: 'gui.spriteSelector.addSpriteFromSurprise',
        description: 'Button to add a random sprite in the target pane',
        defaultMessage: 'Surprise'
    },
    addSpriteFromFile: {
        id: 'gui.spriteSelector.addSpriteFromFile',
        description: 'Button to add a sprite in the target pane from file',
        defaultMessage: 'Upload Sprite'
    }
});

// const imports = new Set([<div key={`importBeetle`}>{`import Beetle`}</div>]);

// const translatedCommandsList = ['forward(', 'turnRight(', 'turnLeft(', 'goTo(', 'goToXY(', 'glideTo(',
// 'glideToXYinSeconds(', 'beetle.', 'changeYby(', 'changeXby(', 'print(', ''];
// 'ifOnEdgeBounce(', 'setRotationStyle(', 'changeSizeBy(', 'show(', 'hide(', 'def ', 'broadcast(', 'broadcastAndWait(',
//     'for ', 'while True', 'if (', 'else:', 'waitUntil(', 'createCloneOf(', 'deleteClone', 'isTouching',
//     'distance(', 'askAndWait(', 'answer', 'isKeyPressed(', 'isMouseDown(', ''...

const eventsMap = new Map();
let importRandom = false;
let importMath = false;

const translateCode = (inputStatement, isValue = false, values = []) => {
    if (inputStatement === null) return [`${inputStatement}${isValue ? '' : '('}`, `${isValue ? '' : ')'}`];
    switch (inputStatement) {
    // COMMENT: motion
    case 'movesteps': return ['forward(', ')'];
    case 'turnright': return ['turnRight(', ')'];
    case 'turnleft': return ['turnLeft(', ')'];
    case 'goto': return ['goTo(', ')'];
    case 'gotoxy': return ['goToXY(', ')'];
    case 'glideto': return ['glideTo(', ')'];
    case 'glidesecstoxy': return ['glideToXYinSeconds(', ')'];
    case 'pointindirection': return [`beetle.heading = ${values[0]}`, '', true];
    case 'pointtowards': return ['pointTowards(', ')'];
    case 'changexby': return ['changeXby(', ')'];
    case 'setx': return [`beetle.x = ${values[0]}`, '', true];
    case 'changeyby': return ['changeYby(', ')'];
    case 'sety': return [`beetle.y = ${values[0]}`, '', true];
    case 'ifonedgebounce': return ['ifOnEdgeBounce(', ')'];
    case 'setrotationstyle': return ['setRotationStyle(', ')'];
    case 'xposition': return ['beetle.x', '', true];
    case 'yposition': return ['beetle.y', '', true];
    case 'direction': return ['beetle.heading', '', true];
        // COMMENT: looks
    case 'say': return ['print(', ')'];
    case 'changesizeby': return ['changeSizeBy(', ')'];
    case 'setsizeto': return ['beetle.size = ', ''];
    case 'show': return ['show(', ')'];
    case 'hide': return ['hide(', ')'];
    case 'size': return ['beetle.size', '', true];
        // COMMENT: sounds
        // COMMENT: events
    case 'whenflagclicked': {
        if (eventsMap.has('whenflagclicked')) {
            eventsMap.set('whenflagclicked', eventsMap.get('whenflagclicked') + 1);
            return [`def whenFlagClicked_${eventsMap.get('whenflagclicked')}(`, '):'];
        }
        eventsMap.set('whenflagclicked', 0);
        return ['def whenFlagClicked(', '):'];
    }
    case 'whenkeypressed': {
        if (eventsMap.has('whenkeypressed')) {
            eventsMap.set('whenkeypressed', eventsMap.get('whenkeypressed') + 1);
            return [`def whenKeyPressed_${eventsMap.get('whenkeypressed')}(key):`, '', true];
        }
        eventsMap.set('whenkeypressed', 0);
        return ['def whenKeyPressed(key):', '', true];
    }
    case 'whenthisspriteclicked': {
        if (eventsMap.has('whenthisspriteclicked')) {
            eventsMap.set('whenthisspriteclicked', eventsMap.get('whenthisspriteclicked') + 1);
            return [`def whenSpriteClicked_${eventsMap.get('whenthisspriteclicked')}(`, '):'];
        }
        eventsMap.set('whenthisspriteclicked', 0);
        return ['def whenSpriteClicked(', '):'];
    }
    case 'whenbackdropswitchesto': {
        if (eventsMap.has('whenbackdropswitchesto')) {
            eventsMap.set('whenbackdropswitchesto', eventsMap.get('whenbackdropswitchesto') + 1);
            return [`def whenBackdropSwitchesTo_${eventsMap.get('whenbackdropswitchesto')}(backdrop):`, '', true];
            // return [`def whenBackdropSwitchesTo_${eventsMap.get('whenbackdropswitchesto')}(`, '):'];
        }
        eventsMap.set('whenbackdropswitchesto', 0);
        return ['def whenBackdropSwitchesTo(backdrop):', '', true];
        // return ['def whenBackdropSwitchesTo("', '"):'];
    }
    case 'whengreaterthan': {
        if (eventsMap.has('whengreaterthan')) {
            eventsMap.set('whengreaterthan', eventsMap.get('whengreaterthan') + 1);
            // return [`def whenKeyPressed${eventsMap.whengreaterthan++}(`, '):'];
            return [`def when${values[1].charAt(0).toUpperCase() + values[1].slice(1).toLowerCase()}GreaterThan${values[0]}_${eventsMap.get('whengreaterthan')}:`, '', true];
        }
        eventsMap.set('whengreaterthan', 0);
        return [`def when${values[1].charAt(0).toUpperCase() + values[1].slice(1).toLowerCase()}GreaterThan${values[0]}:`, '', true];
    }
    case 'whenbroadcastreceived': {
        // return ['def receivedMessage("', '"):'];
        if (eventsMap.has('whenbroadcastreceived')) {
            eventsMap.set('whenbroadcastreceived', eventsMap.get('whenbroadcastreceived') + 1);
            return [`def whenReceivedMessage_${eventsMap.get('whenbroadcastreceived')}(message):`, '', true];
            // return [`def whenReceivedMessage_${eventsMap.get('whenbroadcastreceived')}(`, '):'];
        }
        eventsMap.set('whenbroadcastreceived', 0);
        return ['def whenReceivedMessage(message):', '', true];
        // return ['def whenReceivedMessage("', '"):'];
    }
    case 'broadcast': return [`broadcast("${values[0]}")`, '', true];
    case 'broadcastandwait': return [`broadcastAndWait("${values[0]}")`, '', true];
        // COMMENT: control
        // COMMENT: wait
    case 'repeat': return [`for ${values.toString()} in range(`, '):'];
    case 'forever': return ['while True', ':'];
    case 'if': return ['if (', '):'];
    case 'if_else': return ['if (', '):'];
    case 'else': return ['else:', ''];
    case 'wait_until': return ['waitUntil(', ')'];
        // COMMENT: repeat_until is a special case
        // COMMENT: stop all
    case 'create_clone_of': return ['createCloneOf(', ')'];
    case 'start_as_clone': {
        // return [`def whenStartedAsClone():`, '', true];
        if (eventsMap.has('start_as_clone')) {
            eventsMap.set('start_as_clone', eventsMap.get('start_as_clone') + 1);
            return [`def whenStartedAsClone_${eventsMap.get('start_as_clone')}():`, '', true];
        }
        // eventsMap.start_as_clone = 1;
        eventsMap.set('start_as_clone', 0);
        return [`def whenStartedAsClone():`, '', true];
    }
    case 'delete_this_clone': return ['deleteClone()', '', true];
        // COMMENT: sensing
    case 'touchingobject': return ['isTouching(beetle, ', ')'];
    case 'touchingcolor': return ['isTouchingColour(beetle, ', ')'];
    case 'coloristouchingcolor': return ['isTouching(', ')'];
    case 'distanceto': return ['distance(beetle, ', ')'];
    case 'askandwait': return ['askAndWait(', ')'];
    case 'answer': return ['answer', '', true];
    case 'keypressed': return ['isKeyPressed(', ')'];
    case 'mousedown': return ['isMouseDown(', ')'];
    case 'mousex': return ['mouse.x', '', true];
    case 'mousey': return ['mouse.y', '', true];
    case 'setdragmode': return ['beetle.dragMode = ', ''];
    case 'loudness': return ['loudness', '', true];
    case 'timer': return ['timer', '', true];
    case 'resettimer': return ['timer.reset(', ')'];
    case 'current': return ['current(', ')'];
    case 'dayssince2000': return ['daysSince2000(', ')'];
    case 'username': return ['username', '', true];
        // COMMENT: operators
    case 'add': return [`${values[0]} + ${values[1]}`, '', true];
    case 'subtract': return [`${values[0]} - ${values[1]}`, '', true];
    case 'multiply': return [`${values[0]} * ${values[1]}`, '', true];
    case 'divide': return [`${values[0]} / ${values[1]}`, '', true];
    case 'random': {
        importRandom = true;
        // imports.add(<div key={`importRandom`}>{`import random`}</div>);
        return ['random.randInt(', ')'];
    }
    case 'gt': return [`${values[0]} > ${values[1]}`, '', true];
    case 'lt': return [`${values[0]} < ${values[1]}`, '', true];
    case 'equals': return [`${values[0]} = ${values[1]}`, '', true];
    case 'and': return [`${values[0]} and ${values[1]}`, '', true];
    case 'or': return [`${values[0]} or ${values[1]}`, '', true];
    case 'not': return [`not ${values}`, '', true];
    case 'join': {
        let val0 = values[0];
        let val1 = values[1];
        if (!val0.includes('(') &&
            !val0.includes('[') &&
            !val0.includes(']') &&
            !val0.includes(')')) {
            val0 = `"${val0}"`;
        }
        if (!val1.includes('(') &&
            !val1.includes('[') &&
            !val1.includes(']') &&
            !val1.includes(')')) {
            val1 = `"${val1}"`;
        }
        return [`${val0} + ${val1}`, '', true];
    }

    case 'letter_of': {
        let val1 = values[1];
        if (!val1.includes('(') &&
            !val1.includes('[') &&
            !val1.includes(']') &&
            !val1.includes(')')) {
            val1 = `"${val1}"`;
        }

        return [`${val1}[${values[0]}]`, '', false];
        // return [`${values[1]}[${values[0]}]`, '', true];
    }
    case 'length': {
        let val = values;
        if (!values.includes('(') &&
            !values.includes('[') &&
            !values.includes(']') &&
            !values.includes(')')) {
            val = `"${values}"`;
        }
        return [`len(${val})`, '', true];
    }
    case 'contains': return [`${values[1]} in ${values[0]}`, '', true];
    case 'mod': return [`${values[0]} % ${values[1]}`, '', true];
    case 'round': {
        importMath = true;
        return [`math.round(${values})`, '', true];
    }
    case 'mathop': return [`${values[1]}(${values[0]})`, '', true];
        // COMMENT: variables
    // case 'variable': return ['var(', ')'];
    case 'setvariableto': return [`${values[0]} = ${values[1]}`, '', true];
    case 'changevariableby': return [`${values[1]} ${values[0] > '0' ? '+=' : '-='} ${Math.abs(values[0])}`, '', true];
    case 'showvariable': return ['showVariable(', ')'];
    case 'hidevariable': return ['hideVariable(', ')'];
    // case 'listcontents': return ['list(', ')'];
    case 'addtolist': return [`${values[1]}.append(${values[0]})`, '', true];
    case 'deleteoflist': return [`${values[1]}.pop(${values[0]})`, '', true];
    case 'deletealloflist': return [`${values[0]}.clear()`, '', true];
    case 'insertatlist': return [`${values[2]}.insert(${values[1]},${values[0]})`, '', true];
    case 'replaceitemoflist': return [`${values[2]}[${values[0]}] = ${values[1]}`, '', true];
    case 'itemoflist': return [`${values[1]}[${values[0]}]`, '', true];
    case 'itemnumoflist': return [`${values[1]}.index(${values[0]})`, '', true];
    case 'lengthoflist': return [`len(${values[0]})`, '', true];
    case 'listcontainsitem': return [`${values[0]} in ${values[1]}`, '', true];
    case 'showlist': return ['showList(', ')'];
    case 'hidelist': return ['hideList(', ')'];

        // COMMENT: my blocks

        // COMMENT: other
    case '...': return ['...', '...', true];
    case 'break': return ['break', 'break', true];
    case 'continue': return ['continue', '', true];
        // COMMENT: default
    default: {
        if (inputStatement.indexOf(':') > -1) {
            return [`${inputStatement.substring(0, inputStatement.indexOf(':') + 1)}${isValue ? '' : '('}`, `${isValue ? '' : ')'}`];
        }
        return [`${inputStatement}${isValue ? '' : '('}`, `${isValue ? '' : ')'}`];
    }
    }
};

const findClosingBracketMatchIndex = (str, pos) => {
    if (str[pos] !== '(') {
        return -1;
    }
    let depth = 1;
    for (let i = pos + 1; i < str.length; i++) {
        switch (str[i]) {
        case '(':
            depth++;
            break;
        case ')':
            if (--depth === 0) {
                return i;
            }
            break;
        }
    }
    return -1;
};

const findCommaIndex = inputString => {
    let pointer = 0;
    let bracketCounter = 0;
    for (let i = 0; i < inputString.length; i++) {
        if (inputString[i] === '(') {
            bracketCounter++;
        }
        if (inputString[i] === ')') {
            bracketCounter--;
        }
        if (inputString[i] !== '(' && inputString[i] !== ')') {
            // console.log('non bracket:', inputString[i], bracketCounter);
            if (inputString[i] === ',' && (bracketCounter === 0)) {
                return pointer;
            }
        }
        pointer++;
    }
    return -1;
};

const isParsed = inputString => {
    if (inputString === null || inputString.length === 0) return false;
    return inputString.includes('def');
};

const parseValue = inputValue => {
    if (inputValue === null || inputValue.length === 0) return [];
    if (typeof inputValue === 'string') {
        if (!(inputValue.includes('(') || inputValue.includes(')') || inputValue.includes(','))) {
            return inputValue;
        }
        let bracketPos = 0;
        bracketPos = inputValue.indexOf('(');
        if (bracketPos >= 0) {
            const command = inputValue.substring(0, bracketPos);
            const closingBracketPos = findClosingBracketMatchIndex(inputValue, bracketPos);
            const value = inputValue.substring(bracketPos + 1, closingBracketPos);// .replaceAll(' ', '');
            if (closingBracketPos <= bracketPos) {
                return translateCode(command);
            }
            // console.log(`${command}: ${value}`);
            let splitValue;
            const valueClosingBracketPos = findClosingBracketMatchIndex(value, value.indexOf('('));
            if ((valueClosingBracketPos === (-1)) || (valueClosingBracketPos === (value.length - 1))) {
                // console.log('find comma index in', value.substring(value.indexOf('(') + 1));
                // console.log(findCommaIndex(value.substring(value.indexOf('(') + 1)));
                // console.log(`char at ^: ${value.substring(value.indexOf('(') + 1)[findCommaIndex(value.substring(value.indexOf('(') + 1))]}`);
                if (value.indexOf('(') > -1) {
                    if ((value.indexOf(',') > value.indexOf('('))) {
                        splitValue = [value];
                    } else {
                        splitValue = [value.substring(0, value.indexOf(',')), value.substring(value.indexOf(',') + 1)];
                        // const comma = (value.substring(0, value.indexOf('(') + 1)).length + findCommaIndex(value.substring(value.indexOf('(') + 1));
                        // const firstValue = value.substring(value.indexOf('(') + 1, comma);
                        // const secondPart = value.substring(comma + 1);
                        // splitValue = [firstValue, secondPart.substring(0, (valueClosingBracketPos === (-1)) ? secondPart.length : secondPart.length - 1)];
                        // // splitValue = [value.substring(0, comma), value.substring(comma + 1)];
                    }
                } else {
                    splitValue = [value.substring(0, value.indexOf(',')), value.substring(value.indexOf(',') + 1)];
                }
                // if (value.startsWith('contains') || value.startsWith('join')) {
                //     const firstValue = value.substring(value.indexOf('(') + 1, value.indexOf(','));
                //     const secondPart = value.substring(value.indexOf(',') + 1);
                //     splitValue = [firstValue, secondPart.substring(0, (valueClosingBracketPos === (-1)) ? secondPart.length : secondPart.length - 1)];
                // } else {
                //     splitValue = [value.substring(0, value.indexOf(',')), value.substring(value.indexOf(',') + 1)];
                // }
            } else {
                splitValue = [value.substring(0, value.indexOf(',', valueClosingBracketPos)), value.substring(value.indexOf(',', valueClosingBracketPos) + 1)];
            }
            // console.log(splitValue);
            if (splitValue.includes('undefined')) {
                splitValue = [value.substring(0, value.indexOf(',')), value.substring(value.indexOf(',') + 1)];
            }
            splitValue = splitValue.filter(item => item.length !== 0);
            // console.log('new', splitValue);
            splitValue = splitValue.filter(item => item !== '' && item !== []);
            const transCode = translateCode(command, false, parseValue(splitValue));

            // console.log('translation:');
            // console.log(transCode);
            if (transCode.length === 3) {
                if (transCode[2]) {
                    return `(${transCode[0]})`;
                }
                return `${transCode[0]}`;
            }
            return `${transCode[0]}${parseValue(splitValue)}${transCode[1]}`;
        }
        return inputValue.substring(bracketPos, inputValue.length);
    }
    return inputValue.map(value => parseValue(value));
};


const toAscii = stringLetter => stringLetter.charCodeAt(0);

const fromAscii = number => String.fromCharCode(number);

const getCodeStringFromBlocks = () => {
    if (trees === null) return <div> </div>;
    if (trees.roots.length === 0) return <div> </div>;
    trees.updateAllNodes();
    trees.checkRoots();
    parseJsonObject(null);
    console.log(`roots: ${trees.getRoots()}`);
    if (trees.roots.length === 0) return <div> </div>;
    eventsMap.clear();
    // for (const k in [...eventsMap.keys()]) {
    //     eventsMap.remove(k);
    // }
    // imports.clear();
    // imports.add(<div key={`importBeetle`}>{`import Beetle`}</div>);
    const outputCode = trees.getRoots().map(root => {
        if ((!root.opcode.startsWith('event') || root.opcode.startsWith('event_broadcast')) &&
            !root.opcode.startsWith('procedure') &&
            !root.opcode.includes('start_as_clone')) {
            return <div>{null}</div>;
        }
        let valuesParsed = false;
        const nodes = [[root, 0, 0]];
        const outputComponents = new Set([<div
            key={`${root.opcode}_${root.id}`}
            style={{marginTop: `1ex`}}
        >{'\n'}</div>]);
        while (nodes.length !== 0) {
            const [nnode, indent, counter] = nodes.pop();
            // console.log('node');
            // console.log(nnode);
            if (nnode === null || typeof nnode === 'undefined' || nnode.length === 0) continue;
            if (typeof nnode === 'string') {
                outputComponents.add(<div
                    key={nnode}
                    style={{paddingLeft: `${indent}rem`}}
                >{(nnode.startsWith('else') ||
                    nnode.startsWith('...') ||
                    nnode.startsWith('break') ||
                    nnode.startsWith('continue')) ?
                        translateCode(nnode.substring(0, nnode.indexOf(':')), true)[0] :
                        translateCode(nnode, true)[0]}
                </div>);
                continue;
            }
            if (typeof nnode.length !== 'undefined') {
                Object.values(nnode).forEach(insideNode => {
                    nodes.push([insideNode, indent, counter]);
                });
            } else {
                if (nnode.opcode.includes('setvariable')) {
                    if (!isNaN(Number(nnode.value[0]))) {
                        nnode.value = [nnode.value[1], nnode.value[0]];
                    }
                }
                const opcodeShort = nnode.opcode.substring(nnode.opcode.indexOf('_') + 1);
                let translatedFunctionName = null;

                if (opcodeShort === 'repeat') {
                    translatedFunctionName = translateCode(opcodeShort, false, fromAscii(toAscii('i') + counter));
                } else if (opcodeShort === 'repeat_until') {
                    translatedFunctionName = translateCode('forever', false);
                } else {
                    translatedFunctionName = translateCode(opcodeShort, false, nnode.value);
                }
                if (!valuesParsed) {
                    if (isParsed(nnode.value)) {
                        valuesParsed = true;
                    }
                    const newValue = parseValue(nnode.value);
                    nnode.value = newValue;
                }
                outputComponents.add(<div
                    key={nnode.id}
                    style={{paddingLeft: `${indent}rem`}}
                >{
                        (translatedFunctionName.length === 3) ? (translatedFunctionName[0]) : ((translatedFunctionName[0] === '' ?
                            `${opcodeShort}(${(nnode.value === null) ? '' : nnode.value}` :
                            `${translatedFunctionName[0]}${(nnode.value === null) ||
                        (opcodeShort.startsWith('setvariable')) ||
                        (opcodeShort === 'repeat_until') ? '' : nnode.value}`) + translatedFunctionName[1])
                    }</div>);

                // COMMENT: adds child/next block/node to output
                if ((nnode.opcode.startsWith('event') &&
                    !nnode.opcode.startsWith('event_broadcast')) ||
                    nnode.opcode.startsWith('control_start_as_clone')) {
                    // nodes.push([nnode.childNode, indent + 1, counter]);
                    switch (opcodeShort) {
                    case 'whenkeypressed':
                        nodes.push([nnode.childNode, indent + 2, counter]);
                        if (eventsMap.has('whenkeypressed')) {
                            nodes.push([`if (key == "${nnode.value}"):${eventsMap.get('whenkeypressed') + 1}`, indent + 1, counter]);
                        } else {
                            nodes.push([`if (key == "${nnode.value}"):`, indent + 1, counter]);
                        }
                        break;
                    case 'whenbroadcastreceived':
                        nodes.push([nnode.childNode, indent + 2, counter]);
                        if (eventsMap.has('whenbroadcastreceived')) {
                            nodes.push([`if (message == "${nnode.value}"):${eventsMap.get('whenbroadcastreceived') + 1}`, indent + 1, counter]);
                        } else {
                            nodes.push([`if (message == "${nnode.value}"):`, indent + 1, counter]);
                        }
                        break;
                    case 'whenbackdropswitchesto':
                        nodes.push([nnode.childNode, indent + 2, counter]);
                        if (eventsMap.has('whenbackdropswitchesto')) {
                            nodes.push([`if (backdrop == "${nnode.value}"):${eventsMap.get('whenbackdropswitchesto') + 1}`, indent + 1, counter]);
                        } else {
                            nodes.push([`if (backdrop == "${nnode.value}"):`, indent + 1, counter]);
                        }
                        break;
                    default:
                        nodes.push([nnode.childNode, indent + 1, counter]);
                        break;
                    }
                    // nodes.push([nnode.childNode, indent + 1, counter]);
                } else {
                    nodes.push([nnode.childNode, indent, counter]);
                }

                // COMMENT: adds body, if block has any
                // COMMENT: e.g. repeat, if, ... (any block, that's C-shaped)
                if (typeof nnode.body !== 'undefined') {
                    if (nnode.body.length > 1) {
                        if (opcodeShort === 'if_else') {
                            nodes.push([nnode.body[1], indent + 1, counter]);
                            nodes.push([`else:${nnode.id}`, indent, counter]);
                            nodes.push([nnode.body[0], indent + 1, counter]);
                        } else {
                            nodes.push([nnode.body[0], (indent > 1) ? (indent - 2) : 0, counter]);
                            nodes.push([nnode.body[1], indent + 1, counter]);
                        }
                    } else if (nnode.body.length > 0) {
                        if (nnode.body[0].id === nnode.elseConditionPart) {
                            nodes.push([`...:${nnode.id}`, indent + 1, counter]);
                            nodes.push([`else:${nnode.id}`, indent, counter]);
                            nodes.push([nnode.body[0], indent + 1, counter]);
                        } else if (opcodeShort === 'repeat_until') {
                            nodes.push([`break:${nnode.id}`, indent + 2, counter]);
                            nodes.push([`if (${nnode.value}):`, indent + 1, counter]);
                            nodes.push([nnode.body[0], indent + 1, counter]);
                        } else {
                            nodes.push([nnode.body[0], indent + 1, (opcodeShort === 'repeat') ? (counter + 1) : counter]);
                        }
                    }
                }
            }
        }
        return outputComponents;
    });

    const outputArray = [];
    if (outputCode[0] instanceof Set) {
        outputCode.forEach(itemSet => {
            if (itemSet instanceof Set) {
                itemSet.forEach(item => {
                    const i = outputArray.findIndex(x => x.key === item.key);
                    if (i <= -1) {
                        outputArray.push(item);
                    }
                });
            } else {
                const i = outputArray.findIndex(x => x.key === itemSet.key);
                if (i <= -1) {
                    outputArray.push(itemSet);
                }
            }
        });
    } else {
        outputCode.forEach(item => {
            const i = outputArray.findIndex(x => x.key === item.key);
            if (i <= -1) {
                outputArray.push(item);
            }
        });
    }
    const newOutput = [<div key={`importBeetle`}>{`import Beetle`}</div>];
    console.log('imports:', importRandom, importMath);
    if (importRandom) {
        newOutput.push(<div key={`importRandom`}>{`import random`}</div>);
    }
    if (importMath) {
        newOutput.push(<div key={`importMath`}>{`import math`}</div>);
    }

    eventsMap.clear();
    return newOutput.concat(outputArray);
};

const SpriteSelectorComponent = function (props) {
    const {
        editingTarget,
        hoveredTarget,
        intl,
        onChangeSpriteDirection,
        onChangeSpriteName,
        onChangeSpriteRotationStyle,
        onChangeSpriteSize,
        onChangeSpriteVisibility,
        onChangeSpriteX,
        onChangeSpriteY,
        onDrop,
        onDeleteSprite,
        onDuplicateSprite,
        onExportSprite,
        onFileUploadClick,
        onNewSpriteClick,
        onPaintSpriteClick,
        onSelectSprite,
        onSpriteUpload,
        onSurpriseSpriteClick,
        raised,
        selectedId,
        spriteFileInput,
        sprites,
        stageSize,
        ...componentProps
    } = props;
    let selectedSprite = sprites[selectedId];

    let spriteInfoDisabled = false;
    if (typeof selectedSprite === 'undefined') {
        selectedSprite = {};
        spriteInfoDisabled = true;
    }
    if (trees === null) {
        return (<Box
            className={styles.spriteSelector}
            {...componentProps}
        > </Box>);
    }
    if (trees.roots.filter(root => root.isRoot).length === 0) {
        return (<Box
            className={styles.spriteSelector}
            {...componentProps}
        > </Box>);
    }

    return (
        <Box
            className={styles.spriteSelector}
            {...componentProps}
        >

            {/* <SpriteInfo */}
            {/*     direction={selectedSprite.direction} */}
            {/*     disabled={spriteInfoDisabled} */}
            {/*     name={selectedSprite.name} */}
            {/*     rotationStyle={selectedSprite.rotationStyle} */}
            {/*     size={selectedSprite.size} */}
            {/*     stageSize={stageSize} */}
            {/*     visible={selectedSprite.visible} */}
            {/*     x={selectedSprite.x} */}
            {/*     y={selectedSprite.y} */}
            {/*     onChangeDirection={onChangeSpriteDirection} */}
            {/*     onChangeName={onChangeSpriteName} */}
            {/*     onChangeRotationStyle={onChangeSpriteRotationStyle} */}
            {/*     onChangeSize={onChangeSpriteSize} */}
            {/*     onChangeVisibility={onChangeSpriteVisibility} */}
            {/*     onChangeX={onChangeSpriteX} */}
            {/*     onChangeY={onChangeSpriteY} */}
            {/* /> */}

            {/* <div> */}
            {/* {BLOCKCODE} */}
            {

                getCodeStringFromBlocks()
            }
            {/* </div> */}
            {/* <div>test - aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</div> */}


            {/* <SpriteList */}
            {/*     editingTarget={editingTarget} */}
            {/*     hoveredTarget={hoveredTarget} */}
            {/*     items={Object.keys(sprites).map(id => sprites[id])} */}
            {/*     raised={raised} */}
            {/*     selectedId={selectedId} */}
            {/*     onDeleteSprite={onDeleteSprite} */}
            {/*     onDrop={onDrop} */}
            {/*     onDuplicateSprite={onDuplicateSprite} */}
            {/*     onExportSprite={onExportSprite} */}
            {/*     onSelectSprite={onSelectSprite} */}
            {/* /> */}

            {/* ADD SPRITE BUTTON (bottom right corner) */}

            {/* <ActionMenu */}
            {/*     className={styles.addButton} */}
            {/*     img={spriteIcon} */}
            {/*     moreButtons={[ */}
            {/*         { */}
            {/*             title: intl.formatMessage(messages.addSpriteFromFile), */}
            {/*             img: fileUploadIcon, */}
            {/*             onClick: onFileUploadClick, */}
            {/*             fileAccept: '.svg, .png, .bmp, .jpg, .jpeg, .sprite2, .sprite3, .gif', */}
            {/*             fileChange: onSpriteUpload, */}
            {/*             fileInput: spriteFileInput, */}
            {/*             fileMultiple: true */}
            {/*         }, { */}
            {/*             title: intl.formatMessage(messages.addSpriteFromSurprise), */}
            {/*             img: surpriseIcon, */}
            {/*             onClick: onSurpriseSpriteClick // TODO need real function for this */}
            {/*         }, { */}
            {/*             title: intl.formatMessage(messages.addSpriteFromPaint), */}
            {/*             img: paintIcon, */}
            {/*             onClick: onPaintSpriteClick // TODO need real function for this */}
            {/*         }, { */}
            {/*             title: intl.formatMessage(messages.addSpriteFromLibrary), */}
            {/*             img: searchIcon, */}
            {/*             onClick: onNewSpriteClick */}
            {/*         } */}
            {/*     ]} */}
            {/*     title={intl.formatMessage(messages.addSpriteFromLibrary)} */}
            {/*     tooltipPlace={isRtl(intl.locale) ? 'right' : 'left'} */}
            {/*     onClick={onNewSpriteClick} */}
            {/* /> */}
        </Box>
    );
};

SpriteSelectorComponent.propTypes = {
    editingTarget: PropTypes.string,
    hoveredTarget: PropTypes.shape({
        hoveredSprite: PropTypes.string,
        receivedBlocks: PropTypes.bool
    }),
    intl: intlShape.isRequired,
    onChangeSpriteDirection: PropTypes.func,
    onChangeSpriteName: PropTypes.func,
    onChangeSpriteRotationStyle: PropTypes.func,
    onChangeSpriteSize: PropTypes.func,
    onChangeSpriteVisibility: PropTypes.func,
    onChangeSpriteX: PropTypes.func,
    onChangeSpriteY: PropTypes.func,
    onDeleteSprite: PropTypes.func,
    onDrop: PropTypes.func,
    onDuplicateSprite: PropTypes.func,
    onExportSprite: PropTypes.func,
    onFileUploadClick: PropTypes.func,
    onNewSpriteClick: PropTypes.func,
    onPaintSpriteClick: PropTypes.func,
    onSelectSprite: PropTypes.func,
    onSpriteUpload: PropTypes.func,
    onSurpriseSpriteClick: PropTypes.func,
    raised: PropTypes.bool,
    selectedId: PropTypes.string,
    spriteFileInput: PropTypes.func,
    sprites: PropTypes.shape({
        id: PropTypes.shape({
            costume: PropTypes.shape({
                url: PropTypes.string,
                name: PropTypes.string.isRequired,
                bitmapResolution: PropTypes.number.isRequired,
                rotationCenterX: PropTypes.number.isRequired,
                rotationCenterY: PropTypes.number.isRequired
            }),
            name: PropTypes.string.isRequired,
            order: PropTypes.number.isRequired
        })
    }),
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES)).isRequired
};

export default injectIntl(SpriteSelectorComponent);
