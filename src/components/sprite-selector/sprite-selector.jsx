import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
// import createFragment from "react-addons-create-fragment";

import Box from '../box/box.jsx';
import SpriteInfo from '../../containers/sprite-info.jsx';
import SpriteList from './sprite-list.jsx';
import ActionMenu from '../action-menu/action-menu.jsx';
import {STAGE_DISPLAY_SIZES} from '../../lib/layout-constants';
import {isRtl} from 'scratch-l10n';
import {codeFromBlocks, trees} from '../../containers/blocks.jsx';
import styles from './sprite-selector.css';

import fileUploadIcon from '../action-menu/icon--file-upload.svg';
import paintIcon from '../action-menu/icon--paint.svg';
import spriteIcon from '../action-menu/icon--sprite.svg';
import surpriseIcon from '../action-menu/icon--surprise.svg';
import searchIcon from '../action-menu/icon--search.svg';
import {globalVariable} from '../../index';
// import globalVariable from '../../index.js';
// import {blockCode} from '../../containers/blocks';

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

const reverseObj = obj =>
    Object.keys(obj)
        .reverse()
        .reduce((a, key, _) => {
            a[key] = obj[key];
            return a;
        }, {});

const originalVersionOfGCSFB = () => {
    // const vysledok = Object.values(codeFromBlocks);
    // // eslint-disable-next-line no-console
    // console.log('- -- --- ---- ----- ------ GETTING STRING FROM CODE');
    // // eslint-disable-next-line no-console
    // console.log(typeof vysledok);
    // // eslint-disable-next-line no-console
    // console.log(vysledok);
    // eslint-disable-next-line no-console
    console.log('- -- --- ---- ----- ------ GETTING STRING FROM CODE');
    // eslint-disable-next-line no-console
    console.log(typeof codeFromBlocks);
    // eslint-disable-next-line no-console
    console.log(codeFromBlocks);

    // for (const [key, _] of codeFromBlocks) {
    //     vysledok += key;
    //     vysledok += '\n';
    // }
    // return vysledok.map((i, key) => <div key={key}>{`\t       ${i}`}</div>);
    // <div key={key}>{`${value.opcode}(${value.value})`}</div>
    return Object.values(codeFromBlocks).map(value => <div key={value.id}>{`${value.opcode}(${value.value})`}</div>);
    // return '';
    // return vysledok.join('<br><br>');
};

const translateCode = inputStatement => {
    switch (inputStatement) {
    case 'movesteps': return 'forward';
    case 'turnright': return 'turnRight';
    case 'turnleft': return 'turnLeft';
    case 'goto': return 'goTo';
    case 'gotoxy': return 'goTo';
    case 'if': return 'if ';
    case 'if_else': return 'DIVIDE';
    case 'else': return 'else ';
    case 'gotoxy': return '';
    case 'gotoxy': return '';
    case 'gotoxy': return '';
    case 'gotoxy': return '';
    case 'gotoxy': return '';
    default: return '';
    }
};

const newVersionOfGCSFB = () => {
    if (trees === null) return;
    // eslint-disable-next-line no-console
    console.log('..........................................................................');
    // eslint-disable-next-line no-console
    console.log('..........................................................................');
    // eslint-disable-next-line no-console
    console.log('PRINTING THE FINAL TREE:');
    trees.updateAll();
    trees.checkRoots();
    // eslint-disable-next-line no-console
    console.log('roots ');
    // eslint-disable-next-line no-console
    console.log(trees.getRoots().map(x => x.id));
    // eslint-disable-next-line no-console
    console.log(trees);
    // eslint-disable-next-line no-console
    console.log('..........................................................................');
    // eslint-disable-next-line no-console
    console.log('..........................................................................');
    // eslint-disable-next-line no-console
    console.log(); console.log(); console.log();

    const output = [];
    output.push(<div key={'import01'}>
        {'import Beetle'}
    </div>);
    return output.concat(trees.getRoots().map(root => {
        if (!root.opcode.startsWith('event')) return <div />;
        // // const rootComponent = <div key={root.id}>{`${root.opcode}(${root.value})`}</div>;
        // // console.log(rootComponent);

        const nodes = [[root, 0]];
        console.log('init nodes');
        nodes.forEach(n => console.log(` -- ${n}`));
        // output.push(<div
        //     key={`${root.opcode}_${root.id}`}
        //     style={{marginTop: `1ex`}}
        // >{'\n'}</div>);
        const outputComponents = [<div
            key={`${root.opcode}_${root.id}`}
            style={{marginTop: `1ex`}}
        >{'\n'}</div>];
        while (nodes.length !== 0) {
            console.log('WHILE: nnode');
            const [nnode, index] = nodes.pop();
            if (nnode === null || typeof nnode === 'undefined' || nnode.length === 0) continue;
            console.log(nnode.opcode, nnode);
            // console.log('nodes');
            // nodes.forEach(n => console.log(` -- ${n[0].id}`));
            // console.log('length', nnode.length);
            if (typeof nnode.length !== 'undefined') {
                console.log('----insideNode-----');
                // const insideNodes = [];
                Object.values(nnode).forEach(insideNode => {
                    console.log(insideNode);
                    nodes.push([insideNode, index]);
                });
                // nodes.push(insideNodes.reverse());no
            } else {
                outputComponents.push(<div
                // output.push(<div
                    key={nnode.id}
                    style={{paddingLeft: `${index}rem`}}
                >{(translateCode(nnode.opcode.substring(nnode.opcode.indexOf('_') + 1)) === '' ?
                        `${nnode.opcode.substring(nnode.opcode.indexOf('_') + 1)}(${(nnode.value === null) ? '' : nnode.value})` :
                        `${translateCode(nnode.opcode.substring(nnode.opcode.indexOf('_') + 1))}(${(nnode.value === null) ? '' : nnode.value})`)}</div>);
                //
                // s každým reťazcom prejde slovník, ak tam nebude, tak vráti opcode (upravený)
                //
                // console.log('bod', 'length', nnode.length);
                // console.log('new child', nnode.childNode);
                if (nnode.opcode.startsWith('event')) {
                    nodes.push([nnode.childNode, index + 1]);
                } else {
                    nodes.push([nnode.childNode, index]);
                }
                if (typeof nnode.body !== 'undefined') {
                    // console.log('PUSHING');
                    // console.log(nnode.body);
                    console.log('-------');
                    if (nnode.body.length > 0) {
                        // console.log('new body child', nnode.body, reverseObj(nnode.body));
                        nodes.push([nnode.body, index + 1]);
                    }
                }
            }
        }

        // let node = root;
        // const outputComponents = [];
        // while (node !== null) {
        //     console.log('node');
        //     console.log(node);
        //     outputComponents.push(<div key={node.id}>{`${node.opcode}(${node.value})`}</div>);
        //     // if (node.body.length > 0) nodes.push([nnode.body,index + 1]);
        //     node = node.childNode;
        // }
        // console.log(outputComponents);
        // return output;
        return outputComponents;
    }));
};

const getCodeStringFromBlocks = () =>
    newVersionOfGCSFB()
    // return originalVersionOfGCSFB();
;
// const getCodeStringFromBlocks2 = (blockCode) => {
//     const vysledok = blockCode.blocks;
//     // eslint-disable-next-line no-console
//     console.log('- -- --- ---- ----- ------ GETTING STRING FROM CODE');
//     // eslint-disable-next-line no-console
//     console.log(typeof vysledok);
//     // eslint-disable-next-line no-console
//     console.log(vysledok);
//     // for (const [key, _] of codeFromBlocks) {
//     //     vysledok += key;
//     //     vysledok += '\n';
//     // }
//     return vysledok.map((i, key) => <div key={key}>{`\t       ${i}`}</div>);
//     // return vysledok.join('<br><br>');
// };

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
    // // eslint-disable-next-line no-console
    // console.log(`Sprites:`);
    // // eslint-disable-next-line no-console
    // console.log(sprites);
    // // eslint-disable-next-line no-console
    // console.log(selectedId);
    // let selectedSprite = sprites[selectedId];
    // // eslint-disable-next-line no-console
    // console.log(`Selected sprite`);
    // // eslint-disable-next-line no-console
    // console.log(selectedSprite);
    // eslint-disable-next-line no-console
    console.log('My sprite:');
    // eslint-disable-next-line no-console
    console.log(sprites[selectedId]);

    // let spriteInfoDisabled = false;
    // if (typeof selectedSprite === 'undefined') {
    //     selectedSprite = {};
    //     spriteInfoDisabled = true;
    // }
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

            <div>
                {/* {globalVariable.translatedCode} */}
                {/* {BLOCKCODE} */}
                {
                    getCodeStringFromBlocks()
                    // getCodeStringFromBlocks2(sprites[selectedId])
                }
            </div>
            {/* <div>aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</div> */}


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
