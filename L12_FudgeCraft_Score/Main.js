"use strict";
var L12_FudgeCraft_Score;
(function (L12_FudgeCraft_Score) {
    L12_FudgeCraft_Score.ƒ = FudgeCore;
    window.addEventListener("load", hndLoad);
    L12_FudgeCraft_Score.game = new L12_FudgeCraft_Score.ƒ.Node("FudgeCraft");
    L12_FudgeCraft_Score.grid = new L12_FudgeCraft_Score.Grid();
    let control = new L12_FudgeCraft_Score.Control();
    let viewport;
    let speedCameraRotation = 0.2;
    let speedCameraTranslation = 0.02;
    function hndLoad(_event) {
        const canvas = document.querySelector("canvas");
        L12_FudgeCraft_Score.args = new URLSearchParams(location.search);
        L12_FudgeCraft_Score.ƒ.RenderManager.initialize(true);
        L12_FudgeCraft_Score.ƒ.Debug.log("Canvas", canvas);
        // enable unlimited mouse-movement (user needs to click on canvas first)
        canvas.addEventListener("click", canvas.requestPointerLock);
        // set lights
        let cmpLight = new L12_FudgeCraft_Score.ƒ.ComponentLight(new L12_FudgeCraft_Score.ƒ.LightDirectional(L12_FudgeCraft_Score.ƒ.Color.WHITE));
        cmpLight.pivot.lookAt(new L12_FudgeCraft_Score.ƒ.Vector3(0.5, 1, 0.8));
        // game.addComponent(cmpLight);
        let cmpLightAmbient = new L12_FudgeCraft_Score.ƒ.ComponentLight(new L12_FudgeCraft_Score.ƒ.LightAmbient(L12_FudgeCraft_Score.ƒ.Color.DARK_GREY));
        L12_FudgeCraft_Score.game.addComponent(cmpLightAmbient);
        // setup orbiting camera
        L12_FudgeCraft_Score.camera = new L12_FudgeCraft_Score.CameraOrbit(75);
        L12_FudgeCraft_Score.game.appendChild(L12_FudgeCraft_Score.camera);
        L12_FudgeCraft_Score.camera.setRotationX(-20);
        L12_FudgeCraft_Score.camera.setRotationY(20);
        L12_FudgeCraft_Score.camera.cmpCamera.getContainer().addComponent(cmpLight);
        // setup viewport
        viewport = new L12_FudgeCraft_Score.ƒ.Viewport();
        viewport.initialize("Viewport", L12_FudgeCraft_Score.game, L12_FudgeCraft_Score.camera.cmpCamera, canvas);
        L12_FudgeCraft_Score.ƒ.Debug.log("Viewport", viewport);
        L12_FudgeCraft_Score.points = new L12_FudgeCraft_Score.Points(viewport, document.querySelector("#score"));
        // setup event handling
        viewport.activatePointerEvent("\u0192pointermove" /* MOVE */, true);
        viewport.activateWheelEvent("\u0192wheel" /* WHEEL */, true);
        viewport.addEventListener("\u0192pointermove" /* MOVE */, hndPointerMove);
        viewport.addEventListener("\u0192wheel" /* WHEEL */, hndWheelMove);
        window.addEventListener("keydown", hndKeyDown);
        L12_FudgeCraft_Score.game.appendChild(control);
        if (L12_FudgeCraft_Score.args.get("test"))
            L12_FudgeCraft_Score.startTests();
        else
            startGame();
        updateDisplay();
        L12_FudgeCraft_Score.ƒ.Debug.log("Game", L12_FudgeCraft_Score.game);
    }
    function startGame() {
        L12_FudgeCraft_Score.grid.push(L12_FudgeCraft_Score.ƒ.Vector3.ZERO(), new L12_FudgeCraft_Score.GridElement(new L12_FudgeCraft_Score.Cube(L12_FudgeCraft_Score.CUBE_TYPE.BLACK, L12_FudgeCraft_Score.ƒ.Vector3.ZERO())));
        startRandomFragment();
    }
    function updateDisplay() {
        viewport.draw();
    }
    L12_FudgeCraft_Score.updateDisplay = updateDisplay;
    //#region Interaction
    function hndPointerMove(_event) {
        // if (ƒ.Time.game.hasTimers())
        //   return;
        let segmentBefore = L12_FudgeCraft_Score.camera.getSegmentY();
        L12_FudgeCraft_Score.camera.rotateY(_event.movementX * speedCameraRotation);
        L12_FudgeCraft_Score.camera.rotateX(_event.movementY * speedCameraRotation);
        let segmentAfter = L12_FudgeCraft_Score.camera.getSegmentY();
        if (segmentAfter - segmentBefore) {
            control.rotateToSegment(segmentAfter);
        }
        updateDisplay();
    }
    function hndWheelMove(_event) {
        L12_FudgeCraft_Score.camera.translate(_event.deltaY * speedCameraTranslation);
        updateDisplay();
    }
    function hndKeyDown(_event) {
        if (L12_FudgeCraft_Score.ƒ.Time.game.hasTimers())
            return;
        if (_event.code == L12_FudgeCraft_Score.ƒ.KEYBOARD_CODE.SPACE) {
            dropFragment();
        }
        if (_event.code == L12_FudgeCraft_Score.ƒ.KEYBOARD_CODE.Q)
            control.rotatePerspektive(-90);
        if (_event.code == L12_FudgeCraft_Score.ƒ.KEYBOARD_CODE.E)
            control.rotatePerspektive(90);
        let transformation = L12_FudgeCraft_Score.Control.transformations[_event.code];
        if (transformation)
            move(transformation);
        updateDisplay();
    }
    //#endregion
    //#region Start/Drop Fragments
    function startRandomFragment() {
        let fragment = L12_FudgeCraft_Score.Fragment.getRandom();
        control.cmpTransform.local.translation = L12_FudgeCraft_Score.ƒ.Vector3.Z(5);
        control.setFragment(fragment);
    }
    L12_FudgeCraft_Score.startRandomFragment = startRandomFragment;
    async function dropFragment() {
        let dropped = control.dropFragment();
        let combos = new L12_FudgeCraft_Score.Combos(dropped);
        let combosPopped = await handleCombos(combos);
        if (combosPopped)
            compressAndHandleCombos();
        startRandomFragment();
        updateDisplay();
    }
    //#endregion
    //#region Combos & Compression
    async function compressAndHandleCombos() {
        let moves;
        do {
            moves = compress();
            await L12_FudgeCraft_Score.ƒ.Time.game.delay(400);
            let moved = moves.map(_move => _move.element);
            let combos = new L12_FudgeCraft_Score.Combos(moved);
            await handleCombos(combos);
        } while (moves.length > 0);
    }
    L12_FudgeCraft_Score.compressAndHandleCombos = compressAndHandleCombos;
    async function handleCombos(_combos) {
        let iCombo = 0;
        for (let combo of _combos.found)
            if (combo.length > 2) {
                L12_FudgeCraft_Score.points.showCombo(combo, ++iCombo);
                for (let shrink = Math.PI - Math.asin(0.9); shrink >= 0; shrink -= 0.2) {
                    for (let element of combo) {
                        let mtxLocal = element.cube.cmpTransform.local;
                        mtxLocal.scaling = L12_FudgeCraft_Score.ƒ.Vector3.ONE(Math.sin(shrink) * 1.2);
                    }
                    updateDisplay();
                    await L12_FudgeCraft_Score.ƒ.Time.game.delay(20);
                }
                for (let element of combo)
                    L12_FudgeCraft_Score.grid.pop(element.position);
            }
        updateDisplay();
        return iCombo > 0;
    }
    L12_FudgeCraft_Score.handleCombos = handleCombos;
    function move(_transformation) {
        let animationSteps = 5;
        let fullRotation = 90;
        let fullTranslation = 1;
        let move = {
            rotation: _transformation.rotation ? L12_FudgeCraft_Score.ƒ.Vector3.SCALE(_transformation.rotation, fullRotation) : new L12_FudgeCraft_Score.ƒ.Vector3(),
            translation: _transformation.translation ? L12_FudgeCraft_Score.ƒ.Vector3.SCALE(_transformation.translation, fullTranslation) : new L12_FudgeCraft_Score.ƒ.Vector3()
        };
        if (control.checkCollisions(move).length > 0)
            return;
        move.translation.scale(1 / animationSteps);
        move.rotation.scale(1 / animationSteps);
        L12_FudgeCraft_Score.ƒ.Time.game.setTimer(20, animationSteps, function (_event) {
            control.move(move);
            updateDisplay();
        });
    }
    function compress() {
        let moves = L12_FudgeCraft_Score.grid.compress();
        for (let move of moves) {
            L12_FudgeCraft_Score.grid.pop(move.element.position);
            L12_FudgeCraft_Score.grid.push(move.target, move.element);
        }
        let animationSteps = 5;
        L12_FudgeCraft_Score.ƒ.Time.game.setTimer(20, animationSteps, function () {
            for (let move of moves) {
                let translation = L12_FudgeCraft_Score.ƒ.Vector3.DIFFERENCE(move.target, move.element.position);
                translation.normalize(1 / animationSteps);
                move.element.position = L12_FudgeCraft_Score.ƒ.Vector3.SUM(move.element.position, translation);
            }
            updateDisplay();
        });
        return moves;
    }
    L12_FudgeCraft_Score.compress = compress;
    //#endregion
})(L12_FudgeCraft_Score || (L12_FudgeCraft_Score = {}));
//# sourceMappingURL=Main.js.map