
import * as THREE from '../build/three.module.js';
import {OrbitControls} from '../build/OrbitControls.js';
import {GUI} from '../build/dat.gui.module.js';

var Shaders = {
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere' : {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
          'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };
  var materialatmo , mesh;
  

function main() {
  var shader, uniforms;
 


  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({canvas});
  const fov = 60;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 10;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2.5;
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 2.5;
  controls.maxDistance = 2.5;
  controls.update();

  const scene = new THREE.Scene();

  scene.background = new THREE.Color('#000');
  {
    const loader = new THREE.TextureLoader();
    //texture fundamentals
    //const texture = loader.load('/img/world-3.png', render);

    const geometry = new THREE.SphereBufferGeometry(1, 64, 32);
    //constructor fundamentals
    //const material = new THREE.MeshBasicMaterial({map: texture});
    //scene.add(new THREE.Mesh(geometry, material));

    


     /*atmosphereeeeeeeee GLOBE SHADER INHALT*/ 

     shader = Shaders['earth'];
      uniforms = THREE.UniformsUtils.clone(shader.uniforms);
      uniforms['texture'].value = THREE.ImageUtils.loadTexture('../tex/world-3.png');

      materialatmo = new THREE.ShaderMaterial({

uniforms: uniforms,
vertexShader: shader.vertexShader,
fragmentShader: shader.fragmentShader

});

/*atmosphereeeeeeeee*/ 
mesh = new THREE.Mesh(geometry, materialatmo);
mesh.rotation.y = Math.PI*2;
scene.add(mesh);

    


    shader = Shaders['atmosphere'];
    //uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    materialatmo = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true

        });

        mesh = new THREE.Mesh(geometry, materialatmo);
    mesh.scale.set( 1.2, 1.2, 1.2 );
    scene.add(mesh);
         /*atmosphereeeeeeeee*/ 

    
  }


  
  async function loadJSON(url) {
    const req = await fetch(url);
    return req.json();
  }
  let countryInfos;
  async function loadCountryData() {
    countryInfos = await loadJSON('../rgpro-projects.json');  /* threejsfundamentals: url */
    const lonFudge = Math.PI * 1.5;
    const latFudge = Math.PI;
    // these helpers will make it easy to position the boxes
    // We can rotate the lon helper on its Y axis to the longitude
    const lonHelper = new THREE.Object3D();
    // We rotate the latHelper on its X axis to the latitude
    const latHelper = new THREE.Object3D();
    lonHelper.add(latHelper);
    // The position helper moves the object to the edge of the sphere
    const positionHelper = new THREE.Object3D();
    positionHelper.position.z = 1;
    latHelper.add(positionHelper);
    const labelParentElem = document.querySelector('#labels');
    for (const countryInfo of countryInfos) {
      const {lat, lon, min, max, name, id, hyperlink, datatarget, datatoggle} = countryInfo;
      // adjust the helpers to point to the latitude and longitude
      lonHelper.rotation.y = THREE.Math.degToRad(lon) + lonFudge;
      latHelper.rotation.x = THREE.Math.degToRad(lat) + latFudge;
      // get the position of the lat/lon
      positionHelper.updateWorldMatrix(true, false);
      const position = new THREE.Vector3();
      positionHelper.getWorldPosition(position);
      countryInfo.position = position;
      // compute the area for each country
      const width = max[0] - min[0];
      const height = max[1] - min[1];
      const area = width * height;
      countryInfo.area = area;
      // add an element for each country
      const elem = document.createElement('button');
      const projectTitle = document.createElement('div');
      //const ping = document.createElement('span');
      elem.className = 'location';
      projectTitle.className = 'projectText fade-in-right';
      //ping.className = 'ping';
      //div constructor
      //elem.textContent = name;
      //button name
      projectTitle.textContent = name;
      elem.id = id;
      elem.href = hyperlink;
      elem.setAttribute('data-target', datatarget);
      elem.setAttribute('data-toggle', datatoggle);
      elem.setAttribute('type', 'button');
      labelParentElem.appendChild(elem);
      elem.appendChild(projectTitle);
      //elem.appendChild(ping);
      countryInfo.elem = elem;
    }
    requestRenderIfNotRequested();
  }
  loadCountryData();
  const tempV = new THREE.Vector3();
  const cameraToPoint = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();
  const settings = {
    minArea: 0,
    maxVisibleDot: -0.2,
  };
  /*
  const gui = new GUI({width: 300});
  gui.add(settings, 'minArea', 0, 50).onChange(requestRenderIfNotRequested);
  gui.add(settings, 'maxVisibleDot', -1, 1, 0.01).onChange(requestRenderIfNotRequested);
  */

  function updateLabels() {
    if (!countryInfos) {
      return;
    }
    const large = settings.minArea * settings.minArea;
    // get a matrix that represents a relative orientation of the camera
    normalMatrix.getNormalMatrix(camera.matrixWorldInverse);
    // get the camera's position
    camera.getWorldPosition(cameraPosition);
    for (const countryInfo of countryInfos) {
      const {position, elem, area} = countryInfo;
      // large enough?
      if (area < large) {
        elem.style.display = 'none';
        continue;
      }
      // Orient the position based on the camera's orientation.
      // Since the sphere is at the origin and the sphere is a unit sphere
      // this gives us a camera relative direction vector for the position.
      tempV.copy(position);
      tempV.applyMatrix3(normalMatrix);
      // compute the direction to this position from the camera
      cameraToPoint.copy(position);
      cameraToPoint.applyMatrix4(camera.matrixWorldInverse).normalize();
      // get the dot product of camera relative direction to this position
      // on the globe with the direction from the camera to that point.
      // -1 = facing directly towards the camera
      // 0 = exactly on tangent of the sphere from the camera
      // > 0 = facing away
      const dot = tempV.dot(cameraToPoint);
      // if the orientation is not facing us hide it.
      if (dot > settings.maxVisibleDot) {
        elem.style.display = 'none';
        continue;
      }
      // restore the element to its default display style
      elem.style.display = '';
      // get the normalized screen coordinate of that position
      // x and y will be in the -1 to +1 range with x = -1 being
      // on the left and y = -1 being on the bottom
      tempV.copy(position);
      tempV.project(camera);
      // convert the normalized position to CSS coordinates
      const x = (tempV.x *  .5 + .5) * canvas.clientWidth;
      const y = (tempV.y * -.5 + .5) * canvas.clientHeight;
      // move the elem to that position
      elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;
      // set the zIndex for sorting
      elem.style.zIndex = (-tempV.z * .5 + .5) * 100000 | 0;
    }
  }
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }
  let renderRequested = false;
  function render() {
    renderRequested = undefined;
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    controls.update();
    updateLabels();
    renderer.render(scene, camera);
  }
  render();
  function requestRenderIfNotRequested() {
    if (!renderRequested) {
      renderRequested = true;
      requestAnimationFrame(render);
    }
  }
  controls.addEventListener('change', requestRenderIfNotRequested);
  window.addEventListener('resize', requestRenderIfNotRequested);
}
main();