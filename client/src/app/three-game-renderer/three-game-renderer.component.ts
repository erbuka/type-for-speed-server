import { Component, OnInit, Input, HostListener, ViewContainerRef, ChangeDetectionStrategy, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { IGameInfoResponseData } from '../com-interface';
import { Utility } from '../classes/utility';
import { ClientService } from '../services/client.service';
import * as dat from 'dat.gui';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

import { environment } from 'src/environments/environment';

class Constants {
  public static Left = -25;
  public static Right = 25;
  public static Bottom = -5;
  public static Top = 5;
  public static StartX = -10;
  public static EndX = 10;
  public static CarSpeed = 3;
  public static WorldSpeed = 5;
  public static ObjectChance = 0.05;
  public static Lanes = 4;
  public static get Width(): number { return this.Right - this.Left; };
  public static get Height(): number { return this.Top - this.Bottom; };
}

class Car extends THREE.Group {

  private fwMesh: THREE.Mesh;
  private bwMesh: THREE.Mesh;

  public speed: number = 0;

  constructor(models: { body: THREE.BufferGeometry, wheels: THREE.BufferGeometry, windows: THREE.BufferGeometry },
    materials: { body: THREE.MeshLambertMaterial, wheels: THREE.MeshLambertMaterial, windows: THREE.MeshLambertMaterial }) {
    super();

    let carBodyMesh = new THREE.Mesh(models.body, materials.body);
    let carWindowsMesh = new THREE.Mesh(models.windows, materials.windows);
    this.fwMesh = new THREE.Mesh(models.wheels, materials.wheels);
    this.bwMesh = new THREE.Mesh(models.wheels, materials.wheels);

    carBodyMesh.castShadow = true;
    carWindowsMesh.castShadow = true;
    this.fwMesh.castShadow = true;
    this.bwMesh.castShadow = true;


    let fwGroup = new THREE.Group(),
      bwGroup = new THREE.Group();

    fwGroup.add(this.fwMesh);
    fwGroup.translateX(0.29);
    fwGroup.translateZ(0.1);

    bwGroup.add(this.bwMesh);
    bwGroup.translateX(-0.2);
    bwGroup.translateZ(0.1);

    this.add(carBodyMesh, carWindowsMesh, fwGroup, bwGroup);

  }

  update(dt: number): void {
    this.bwMesh.rotateY(dt * this.speed);
    this.fwMesh.rotateY(dt * this.speed);
  }
}

class ThreeRendererUtility {

  static loadTexture(url: string, wrapS: THREE.Wrapping = THREE.RepeatWrapping, wrapT: THREE.Wrapping = THREE.RepeatWrapping): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      let laoder = new THREE.TextureLoader();
      laoder.load(
        url,
        t => {
          t.wrapS = wrapS;
          t.wrapT = wrapT;
          t.minFilter = THREE.LinearMipMapLinearFilter;
          t.magFilter = THREE.LinearFilter;
          t.anisotropy = 4;
          resolve(t);
        },
        undefined,
        e => reject(e.message));
    });
  }

  static loadObj(url: string): Promise<{ [name: string]: THREE.BufferGeometry }> {


    return new Promise((resolve, reject) => {
      let loader = new OBJLoader();

      loader.load(
        url,
        obj => {

          let result = {};

          if (obj instanceof THREE.Group) {
            for (let c of obj.children) {
              result[c.name] = (<THREE.Mesh>c).geometry;
            }
            resolve(result);
          } else {
            reject("Not a group");
            return;
          }
        },
        undefined,
        err => reject(err)
      );

    });
  }

}

@Component({
  selector: 'app-three-game-renderer',
  templateUrl: './three-game-renderer.component.html',
  styleUrls: ['./three-game-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreeGameRendererComponent implements OnInit, OnChanges {

  @Input() game: IGameInfoResponseData = null;

  private renderer: THREE.WebGLRenderer = null;
  private prevTime: number = 0;

  private cameraGroup: THREE.Group = null;

  private scene: THREE.Scene = null;
  private camera: THREE.PerspectiveCamera = null;
  private cars: Map<string, Car> = new Map();
  private objects: THREE.Object3D[] = [];
  private treeModels: { log: THREE.BufferGeometry, leaves: THREE.BufferGeometry }[] = [];
  private carBodyModel: THREE.BufferGeometry = null;
  private carWindowsModel: THREE.BufferGeometry = null;
  private carWheelsModel: THREE.BufferGeometry = null;

  private lightSun: THREE.DirectionalLight = null;

  private roadGeom: THREE.BufferGeometry = null;

  private texRoad: THREE.Texture = null;
  private texFinishFlag: THREE.Texture = null;

  private matTreeLog: THREE.MeshLambertMaterial = null;
  private matTreeLeaves: THREE.MeshLambertMaterial[] = null;

  private uOffset: number = 0;

  constructor(private viewContainerRef: ViewContainerRef, private clientService: ClientService, private zone: NgZone) { }

  ngOnChanges(changes: SimpleChanges) {

    if (!changes.game.previousValue && changes.game.currentValue) {
      // New game is starting

      // Instantiate cars
      this.cars = new Map();

      let black = new THREE.MeshLambertMaterial({ color: 0 });

      for (let i = 0; i < this.game.players.length; i++) {

        let player = this.game.players[i];

        let car = new Car({ body: this.carBodyModel, wheels: this.carWheelsModel, windows: this.carWindowsModel },
          { body: new THREE.MeshLambertMaterial({ color: player.color }), wheels: black, windows: black });

        car.position.set(Constants.StartX, i - Constants.Lanes / 2 + 0.5, 0);

        this.scene.add(car);
        this.cars.set(player.id, car);

      }


    } else if (changes.game.previousValue && !changes.game.currentValue) {
      // Game has ended

      this.cars.forEach(car => this.scene.remove(car));
      this.cars.clear();

    }
  }

  ngOnInit() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.domElement.style.display = "block";

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    Promise.all([
      ThreeRendererUtility.loadTexture("assets/textures/road.jpg").then(t => this.texRoad = t),
      ThreeRendererUtility.loadTexture("assets/textures/finish.jpg").then(t => this.texFinishFlag = t),
      ThreeRendererUtility.loadObj("assets/models/tree0.obj").then(t => this.treeModels.push({ log: t.log, leaves: t.leaves })),
      ThreeRendererUtility.loadObj("assets/models/car0.obj").then(c => {
        this.carBodyModel = c.car_body;
        this.carWindowsModel = c.windows;
        this.carWheelsModel = c.wheels;

        this.carBodyModel.scale(0.5, 0.5, 0.5);
        this.carWindowsModel.scale(0.5, 0.5, 0.5);
        this.carWheelsModel.scale(0.5, 0.5, 0.5);

        this.carBodyModel.rotateX(Math.PI / 2);
        this.carWindowsModel.rotateX(Math.PI / 2);
        this.carWheelsModel.rotateX(Math.PI / 2);

      })
    ]).then(() => {
      this.viewContainerRef.element.nativeElement.appendChild(this.renderer.domElement);
      this.start();
    })
  }

  @HostListener("window:resize")
  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  private start() {
    this.initializeScene();
    if (!environment.production)
      this.initDebugGUI();
    this.resize();

    this.prevTime = Date.now();


    this.zone.runOutsideAngular(() => this.loop());
  }

  private initDebugGUI() {
    let gui = new dat.GUI();

    let cameraFolder = gui.addFolder("Camera");

    cameraFolder.open();

    cameraFolder.add(this.camera.position, 'x', -50, 50);
    cameraFolder.add(this.camera.position, 'y', -50, 50);
    cameraFolder.add(this.camera.position, 'z', -50, 50);

  }

  private createTree(): THREE.Group {

    let model = this.treeModels[Math.floor(Math.random() * this.treeModels.length)];

    let meshLog = new THREE.Mesh(model.log, this.matTreeLog);
    let meshLeaves = new THREE.Mesh(model.leaves, this.matTreeLeaves.random());

    meshLog.castShadow = true;
    meshLog.receiveShadow = true;
    meshLeaves.castShadow = true;
    meshLeaves.receiveShadow = true;

    let result = new THREE.Group();

    result.rotateX(Math.PI / 2);

    result.add(meshLog, meshLeaves);

    return result;
  }

  private initializeScene() {
    this.scene = new THREE.Scene();

    // Shared materials
    this.matTreeLog = new THREE.MeshLambertMaterial({ color: 0x880000 })
    this.matTreeLeaves = [
      new THREE.MeshLambertMaterial({ color: 0x008800 }),
      new THREE.MeshLambertMaterial({ color: 0x006622 }),
    ]

    this.cameraGroup = new THREE.Group();
    this.scene.add(this.cameraGroup);

    // Camera
    {
      this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);

      this.camera.position.z = 5.5;
      this.camera.position.y = -5.5;
      this.camera.position.x = 0;

      this.cameraGroup.add(this.camera);
    }
    // Sun light
    {
      this.lightSun = new THREE.DirectionalLight(0xffffff, 0.5);

      this.lightSun.position.set(-2, -2, 10);
      this.lightSun.target.position.set(0, 0, 0);

      this.lightSun.castShadow = true;

      this.lightSun.shadow.mapSize.set(2048, 2048);
      this.lightSun.shadow.camera.near = -10;
      this.lightSun.shadow.camera.far = 100;
      this.lightSun.shadow.camera.left = -10;
      this.lightSun.shadow.camera.right = 10;
      this.lightSun.shadow.camera.bottom = -10;
      this.lightSun.shadow.camera.top = 10;
      //this.scene.add(new CameraHelper(this.lightSun.shadow.camera));

      this.cameraGroup.add(this.lightSun.target);
      this.cameraGroup.add(this.lightSun);
    }

    // Ambient light
    {
      let ambientLight = new THREE.AmbientLight(0x888888);

      this.scene.add(ambientLight);

    }

    // Road
    {
      let roadGeom = new THREE.PlaneBufferGeometry(Constants.Width, 4);

      let uv = <THREE.BufferAttribute>(roadGeom.attributes.uv);
      uv.normalized = false;

      uv
        .setUsage(THREE.DynamicDrawUsage)
        .set(new Float32Array([
          0, 1,
          Constants.Width, 1,
          0, 0,
          Constants.Width, 0
        ]));


      uv.needsUpdate = true;

      let roadMat = new THREE.MeshLambertMaterial({ map: this.texRoad });
      let roadMesh = new THREE.Mesh(roadGeom, roadMat);

      roadMesh.position.z = 0.01;
      roadMesh.castShadow = false;
      roadMesh.receiveShadow = true;

      this.roadGeom = roadGeom;

      this.scene.add(roadMesh);
    }

    // Ground
    {
      let groundGeom = new THREE.PlaneBufferGeometry(Constants.Width, Constants.Height);

      groundGeom.translate(Constants.Width / 2 + Constants.Left, Constants.Height / 2 + Constants.Bottom, 0);

      let uv = <THREE.BufferAttribute>(groundGeom.attributes.uv);
      uv.normalized = false;

      uv
        .setUsage(THREE.DynamicDrawUsage)
        .set(new Float32Array([
          0, Constants.Height,
          Constants.Width, Constants.Width,
          0, 0,
          Constants.Height, 0
        ]));
      uv.needsUpdate = true;


      let groundMat = new THREE.MeshLambertMaterial({ color: 0x88ff88 });
      let groundMesh = new THREE.Mesh(groundGeom, groundMat);

      groundMesh.castShadow = false;
      groundMesh.receiveShadow = true;

      this.scene.add(groundMesh);

    }

    // Start ?? 
    {

    }

    // Finish
    {
      // Flag

      const height = 2;
      const pyllarRadius = 0.1

      {
        let flagGeom = new THREE.PlaneBufferGeometry(0.5, Constants.Lanes);
        let flagMat = new THREE.MeshLambertMaterial({ map: this.texFinishFlag });

        flagGeom.rotateY(-Math.PI / 2);
        flagGeom.translate(Constants.EndX, 0, height - 0.25);


        let uv = <THREE.BufferAttribute>flagGeom.attributes['uv'];

        uv.normalized = false;
        uv.set(new Float32Array([
          0, Constants.Lanes,
          1, Constants.Lanes,
          0, 0,
          1, 0,
        ]));
        uv.needsUpdate = true;

        let flagMesh = new THREE.Mesh(flagGeom, flagMat);

        flagMesh.castShadow = true;

        this.scene.add(flagMesh);
      }

      // Pyllars
      {
        let pyllarMat = new THREE.MeshLambertMaterial({ color: 0x666666 })
        for (let k of [-1, 1]) {
          let pyllarGeom = new THREE.BoxBufferGeometry(pyllarRadius * 2, pyllarRadius * 2, height);

          pyllarGeom.translate(Constants.EndX, (Constants.Lanes / 2 + pyllarRadius) * k, height / 2);

          let pyllarMesh = new THREE.Mesh(pyllarGeom, pyllarMat);

          pyllarMesh.castShadow = true;

          this.scene.add(pyllarMesh);

        }
      }



    }


    // Scene objects

    for (let x = Constants.Left; x < Constants.Right; x++) {
      for (let y = Constants.Bottom; y < Constants.Top; y++) {
        if ((y < -Constants.Lanes / 2 || y >= Constants.Lanes / 2) && Math.random() <= Constants.ObjectChance) {

          let tree = this.createTree();

          tree.position.set(x + 0.5, y + 0.5, 0);

          this.objects.push(tree);

          this.scene.add(tree);
        }
      }
    }



  }

  private loop() {
    window.requestAnimationFrame(this.loop.bind(this));

    NgZone.assertNotInAngularZone();

    let now = Date.now();
    let dt = (now - this.prevTime) / 1000;
    this.prevTime = now;

    this.update(dt);
    this.render(dt);

  }

  private update(dt: number) {

    if (this.game) {

      let self = this.game.players.find(p => p.id === this.clientService.id);

      this.cars.forEach(c => {
        c.speed = (this.game.state.started && !this.game.state.over) ? Constants.WorldSpeed : 0;
        c.update(dt);
      })

      for (let p of this.game.players) {
        let car = this.cars.get(p.id);
        let targetX = Constants.StartX + (Constants.EndX - Constants.StartX) * (p.position / this.game.text.length);
        let carSpeed = Math.max(Math.abs(car.position.x - targetX), Constants.CarSpeed);
        car.position.x = Utility.moveTowards(car.position.x, targetX, carSpeed * dt);

        if (p.id === self.id) {
          let cameraSpeed = Math.max(Math.abs(this.cameraGroup.position.x - targetX), Constants.CarSpeed);
          this.cameraGroup.position.x = Utility.moveTowards(this.cameraGroup.position.x, targetX, cameraSpeed * dt);
        }
      }

      if (this.game.state.started && self.position < this.game.text.length) {
        let worldStep = dt * Constants.WorldSpeed;

        this.uOffset = (this.uOffset + worldStep) % 1;

        // Update all the objects
        for (let o of this.objects) {
          o.position.x -= worldStep;

          if (o.position.x < Constants.Left)
            o.position.x += Constants.Width;
        }

        // Update road UV
        {
          let uv = <THREE.BufferAttribute>(this.roadGeom.attributes['uv']);

          uv.set(new Float32Array([
            this.uOffset, 1,
            Constants.Width + this.uOffset, 1,
            this.uOffset, 0,
            Constants.Width + this.uOffset, 0
          ]));
          uv.needsUpdate = true;
        }


        // Update ground UV
        {
          /*
          let uv = <THREE.BufferAttribute>(this.groundGeom.attributes['uv']);

          uv.setArray(new Float32Array([
            this.uOffset, Constants.RoadLength,
            Constants.RoadLength + this.uOffset, Constants.RoadLength,
            this.uOffset, 0,
            Constants.RoadLength + this.uOffset, 0
          ]));
          uv.needsUpdate = true;
          */
        }

      }

    }

    this.camera.lookAt(this.cameraGroup.position.x, -Constants.Lanes / 2, 0);

  }

  private render(dt: number) {
    this.renderer.render(this.scene, this.camera);
  }

}
