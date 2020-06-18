"use strict";
var L10_TowerDefensePath;
(function (L10_TowerDefensePath) {
    // import ƒ = FudgeCore;
    // import ƒAid = FudgeAid;
    class ComponentPicker extends ƒ.Component {
        constructor(_radius = 0.5) {
            super();
            this.radius = 0.5;
            this.radius = _radius;
        }
        drawPickRadius(_viewport) {
            let pickData = this.getPickData();
            let crc2 = _viewport.getContext();
            crc2.save();
            crc2.beginPath();
            crc2.arc(pickData.canvas.x, pickData.canvas.y, pickData.radius.magnitude, 0, 2 * Math.PI);
            crc2.strokeStyle = "#000000";
            crc2.fillStyle = "#ffffff80";
            crc2.stroke();
            crc2.fill();
        }
        pick(_client) {
            let pickData = this.getPickData();
            let distance = ƒ.Vector2.DIFFERENCE(_client, pickData.canvas);
            if (distance.magnitudeSquared < pickData.radius.magnitudeSquared)
                return pickData;
            return null;
        }
        getPickData() {
            let node = this.getContainer();
            let projection = L10_TowerDefensePath.viewport.camera.project(node.mtxWorld.translation);
            let posClient = L10_TowerDefensePath.viewport.pointClipToClient(projection.toVector2());
            let projectionRadius = ƒ.Vector3.X(this.radius * node.mtxWorld.scaling.magnitude); // / 1.414);
            projectionRadius.transform(L10_TowerDefensePath.viewport.camera.pivot, false);
            projectionRadius = L10_TowerDefensePath.viewport.camera.project(ƒ.Vector3.SUM(node.mtxWorld.translation, projectionRadius));
            let posRadius = L10_TowerDefensePath.viewport.pointClipToClient(projectionRadius.toVector2());
            return { clip: projection, canvas: posClient, radius: ƒ.Vector2.DIFFERENCE(posRadius, posClient) };
        }
    }
    L10_TowerDefensePath.ComponentPicker = ComponentPicker;
})(L10_TowerDefensePath || (L10_TowerDefensePath = {}));
var L10_TowerDefensePath;
(function (L10_TowerDefensePath) {
    let Enemy = /** @class */ (() => {
        class Enemy extends ƒ.Node {
            constructor(_name, _pos) {
                super(_name);
                this.health = 1;
                this.stamina = 1;
                this.speed = 0.3 / 1000;
                this.nextWaypoint = 0;
                this.addComponent(new ƒ.ComponentTransform(ƒ.Matrix4x4.TRANSLATION(_pos)));
                let cmpMaterial = new ƒ.ComponentMaterial(Enemy.material);
                cmpMaterial.clrPrimary = ƒ.Color.CSS("lightblue");
                this.addComponent(cmpMaterial);
                let cmpMesh = new ƒ.ComponentMesh(Enemy.mesh);
                this.addComponent(cmpMesh);
                cmpMesh.pivot.scale(ƒ.Vector3.ONE(0.5));
                cmpMesh.pivot.translateY(0.5);
                ƒ.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, this.update.bind(this));
            }
            update() {
                // via mutator for demonstration
                let distanceTravel = this.speed * ƒ.Loop.timeFrameGame;
                let mutator = this.mtxLocal.getMutator();
                mutator.translation.x += distanceTravel;
                if (mutator.translation.x > 5)
                    mutator.translation.x = -5;
                this.mtxLocal.mutate(mutator);
                let distanceToWaypoint = ƒ.Vector3.DIFFERENCE(this.mtxLocal.translation, L10_TowerDefensePath.path[this.nextWaypoint]).magnitudeSquared;
                if (distanceToWaypoint < distanceTravel * distanceTravel)
                    this.nextWaypoint = this.nextWaypoint++ % L10_TowerDefensePath.sizeTerrain;
            }
        }
        Enemy.material = new ƒ.Material("Enemy", ƒ.ShaderFlat, new ƒ.CoatColored());
        Enemy.mesh = new ƒ.MeshSphere(4, 2);
        return Enemy;
    })();
    L10_TowerDefensePath.Enemy = Enemy;
})(L10_TowerDefensePath || (L10_TowerDefensePath = {}));
var L10_TowerDefensePath;
(function (L10_TowerDefensePath) {
    // import ƒ = FudgeCore;
    var ƒAid = FudgeAid;
    window.addEventListener("load", hndLoad);
    L10_TowerDefensePath.sizeTerrain = 10;
    function hndLoad(_event) {
        const canvas = document.querySelector("canvas");
        let graph = new ƒ.Node("Graph");
        let cmpCamera = new ƒ.ComponentCamera();
        cmpCamera.pivot.translate(new ƒ.Vector3(10, 5, 10));
        cmpCamera.pivot.lookAt(ƒ.Vector3.ZERO());
        cmpCamera.backgroundColor = ƒ.Color.CSS("lightblue");
        L10_TowerDefensePath.viewport = new ƒ.Viewport();
        L10_TowerDefensePath.viewport.initialize("Viewport", graph, cmpCamera, canvas);
        ƒ.Debug.log(L10_TowerDefensePath.viewport);
        ƒAid.addStandardLightComponents(graph, new ƒ.Color(0.5, 0.5, 0.5));
        graph.addChild(new ƒAid.NodeCoordinateSystem());
        graph.addChild(createTerrain());
        L10_TowerDefensePath.path = createPath();
        // addTowers(graph);
        graph.addChild(new L10_TowerDefensePath.Tower("Tower1", ƒ.Vector3.Z(4)));
        graph.addChild(new L10_TowerDefensePath.Enemy("Enemy1", L10_TowerDefensePath.path[0]));
        L10_TowerDefensePath.viewport.draw();
        // viewport.addEventListener(ƒ.EVENT_POINTER.MOVE, pointerMove);
        // viewport.activatePointerEvent(ƒ.EVENT_POINTER.MOVE, true);
        ƒ.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        ƒ.Loop.start(ƒ.LOOP_MODE.TIME_REAL, 30);
    }
    function update(_event) {
        let tower = L10_TowerDefensePath.viewport.getGraph().getChildrenByName("Tower1")[0];
        let enemy = L10_TowerDefensePath.viewport.getGraph().getChildrenByName("Enemy1")[0];
        tower.follow(enemy);
        L10_TowerDefensePath.viewport.draw();
        L10_TowerDefensePath.path.render(L10_TowerDefensePath.viewport);
    }
    function createTerrain() {
        let mtrPlane = new ƒ.Material("Plane", ƒ.ShaderFlat, new ƒ.CoatColored(ƒ.Color.CSS("green")));
        let meshPlane = new ƒ.MeshQuad();
        let mtxPlane = ƒ.Matrix4x4.ROTATION_X(-90);
        mtxPlane.scale(ƒ.Vector3.ONE(L10_TowerDefensePath.sizeTerrain));
        let plane = new ƒAid.Node("Plane", mtxPlane, mtrPlane, meshPlane);
        return plane;
    }
    function createPath() {
        let path = new L10_TowerDefensePath.Path();
        for (let i = 0; i <= L10_TowerDefensePath.sizeTerrain; i++) {
            path.push(new ƒ.Vector3(i - L10_TowerDefensePath.sizeTerrain / 2, 0, ƒ.Random.default.getRange(-L10_TowerDefensePath.sizeTerrain, L10_TowerDefensePath.sizeTerrain) / 4));
        }
        return path;
    }
    /*
    function createPickerTestCubes(): ƒ.Node {
      let cubes: ƒ.Node = new ƒ.Node("Cubes");
  
      let mtrWhite: ƒ.Material = new ƒ.Material("White", ƒ.ShaderFlat, new ƒ.CoatColored());
      let meshCube: ƒ.MeshCube = new ƒ.MeshCube();
  
      for (let i: number = 0; i < 0; i++) {
        let range: number = 4;
        let pos: ƒ.Vector3 = new ƒ.Vector3(ƒ.Random.default.getRange(-range, range), ƒ.Random.default.getRange(-range, range), ƒ.Random.default.getRange(-range, range));
        let cube: ƒAid.Node = new ƒAid.Node("Cube" + i, ƒ.Matrix4x4.TRANSLATION(pos), mtrWhite, meshCube);
        cube.mtxLocal.scale(ƒ.Vector3.ONE(1));
        cube.addComponent(new ComponentPicker());
        cubes.addChild(cube);
      }
      return cubes;
    }
    function pointerMove(_event: ƒ.EventPointer): void {
      let posMouse: ƒ.Vector2 = new ƒ.Vector2(_event.canvasX, _event.canvasY);
      let cubes: ƒ.Node[] = viewport.getGraph().getChild(1).getChildren();
      let picked: { z: number; picker: ComponentPicker, name: string }[] = [];
      for (let cube of cubes) {
        let cmpPicker: ComponentPicker = cube.getComponent(ComponentPicker);
        let pickData: PickData = cmpPicker.pick(posMouse);
        let cmpMaterial: ƒ.ComponentMaterial = cube.getComponent(ƒ.ComponentMaterial);
        cmpMaterial.clrPrimary = ƒ.Color.CSS("white");
        if (pickData) {
          cmpMaterial.clrPrimary = ƒ.Color.CSS("red");
          picked.push({ z: pickData.clip.z, picker: cmpPicker, name: cube.name });
        }
      }
      picked.sort((_a, _b) => _a.z > _b.z ? 1 : -1);
      console.clear();
      console.table(picked);
      viewport.draw();
  
      for (let pick of picked)
        pick.picker.drawPickRadius(viewport);
    }
    */
})(L10_TowerDefensePath || (L10_TowerDefensePath = {}));
var L10_TowerDefensePath;
(function (L10_TowerDefensePath) {
    class Path extends Array {
        // public waypoints: ƒ.Vector3[] = [];
        render(_viewport) {
            let crc2 = _viewport.getContext();
            let first = true;
            for (let waypoint of this) {
                let projection = L10_TowerDefensePath.viewport.camera.project(waypoint);
                let posClient = L10_TowerDefensePath.viewport.pointClipToClient(projection.toVector2());
                if (first)
                    crc2.moveTo(posClient.x, posClient.y);
                else
                    crc2.lineTo(posClient.x, posClient.y);
                first = false;
            }
            crc2.stroke();
        }
    }
    L10_TowerDefensePath.Path = Path;
})(L10_TowerDefensePath || (L10_TowerDefensePath = {}));
var L10_TowerDefensePath;
(function (L10_TowerDefensePath) {
    var ƒAid = FudgeAid;
    let Tower = /** @class */ (() => {
        class Tower extends ƒ.Node {
            constructor(_name, _pos) {
                super(_name);
                this.health = 1;
                this.strength = 0.1;
                this.range = 4;
                this.rate = 0.5;
                let base = new ƒAid.Node("Base", null, Tower.material, Tower.meshBase);
                this.top = new ƒAid.Node("Top", ƒ.Matrix4x4.TRANSLATION(ƒ.Vector3.Y(1)), Tower.material, Tower.meshTop);
                this.gun = new ƒAid.Node("Base", ƒ.Matrix4x4.IDENTITY(), Tower.material, Tower.meshGun);
                let mtxGun = this.gun.getComponent(ƒ.ComponentMesh).pivot;
                mtxGun.scale(new ƒ.Vector3(0.1, 0.1, 1));
                mtxGun.translateZ(0.5);
                this.addComponent(new ƒ.ComponentTransform(ƒ.Matrix4x4.TRANSLATION(_pos)));
                this.addChild(base);
                this.addChild(this.top);
                this.top.addChild(this.gun);
            }
            follow(_enemy) {
                let distanceSquared = ƒ.Vector3.DIFFERENCE(this.mtxWorld.translation, _enemy.mtxWorld.translation).magnitudeSquared;
                if (distanceSquared > (this.range * this.range))
                    return;
                // this.top.mtxLocal.lookAt(_enemy.mtxWorld.translation, ƒ.Vector3.Y());
                this.top.mtxWorld.lookAt(_enemy.mtxWorld.translation, ƒ.Vector3.Y());
                let local = this.calculateRelativeMatrix(this.top.mtxWorld, this.top.getParent().mtxWorld);
                this.top.cmpTransform.local = local;
                // this.gun.mtxLocal.lookAt(_enemy.mtxWorld.translation);
            }
            calculateRelativeMatrix(_matrix, _relativeTo) {
                let result;
                result = ƒ.Matrix4x4.INVERSION(_relativeTo);
                result = ƒ.Matrix4x4.MULTIPLICATION(result, _matrix);
                return result;
            }
        }
        Tower.material = new ƒ.Material("Tower", ƒ.ShaderFlat, new ƒ.CoatColored());
        Tower.meshBase = new ƒ.MeshPyramid();
        Tower.meshTop = new ƒ.MeshSphere(10, 4);
        Tower.meshGun = new ƒ.MeshCube();
        return Tower;
    })();
    L10_TowerDefensePath.Tower = Tower;
})(L10_TowerDefensePath || (L10_TowerDefensePath = {}));
//# sourceMappingURL=TowerDefense.js.map