import {extendFoundationSchema} from './foundation-schema.js';
import {foundationSettings,objectExtensions} from './foundation.js';
import {vehicleSettings} from './vehicle.js';
import {materialSettings,environmentSettings} from './visuals.js';
import {checkHierarchy,worldTransforms} from './scene-graph.js';
import {validateComponents,audioSchema,interactionSchema,lightSchema} from './components.js';
export const schema = {type:'object',additionalProperties:false,required:['version','name','description','sky','spawn','objects','lighting'],properties:{version:{type:'integer',enum:[1]},name:{type:'string'},description:{type:'string'},sky:{type:'string'},lighting:{type:'object',additionalProperties:false,required:['intensity','ambient'],properties:{intensity:{type:'number',minimum:0,maximum:8},ambient:{type:'number',minimum:0,maximum:5}}},spawn:{type:'array',items:{type:'number'},minItems:3,maxItems:3},objects:{type:'array',maxItems:200,items:{type:'object',additionalProperties:false,required:['id','name','shape','position','size','color','behavior','rotation','audio','interaction','pointLight'],properties:{audio:audioSchema,interaction:interactionSchema,pointLight:lightSchema,id:{type:'string'},name:{type:'string'},shape:{type:'string',enum:['box','sphere','cylinder']},position:{type:'array',items:{type:'number'},minItems:3,maxItems:3},size:{type:'array',items:{type:'number'},minItems:3,maxItems:3},rotation:{type:'array',items:{type:'number'},minItems:3,maxItems:3},color:{type:'string'},behavior:{type:'string',enum:['solid','collectible','hazard','checkpoint','finish','decoration']}}}}}};
export function validateProject(p){
 if(!p||p.version!==1||typeof p.name!=='string'||p.name.length>100||typeof p.description!=='string'||p.description.length>3000)throw Error('Invalid project name, description, or version.');
 const vector=(v,min=-10000,max=10000)=>Array.isArray(v)&&v.length===3&&v.every(n=>Number.isFinite(n)&&n>=min&&n<=max);
 const color=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
 if(!vector(p.spawn)||!color(p.sky)||!Array.isArray(p.objects)||p.objects.length>200)throw Error('Invalid spawn, sky, or object count (maximum 200).');
 if(p.script!==undefined&&(typeof p.script!=='string'||p.script.length>30000))throw Error('Script must be under 30,000 characters.');
 if(p.cameraMode!==undefined&&!['first','third','top'].includes(p.cameraMode))throw Error('Invalid camera mode.');if(p.gameMode!==undefined&&!['freeplay','collectathon','race','shooter'].includes(p.gameMode))throw Error('Invalid game mode.');
 environmentSettings(p.environment);checkHierarchy(p.objects);
 const ids=new Set();for(const o of p.objects){if(!o||typeof o.id!=='string'||!o.id||['__proto__','constructor','prototype'].includes(o.id)||o.id.length>100||ids.has(o.id)||typeof o.name!=='string'||o.name.length>100||!['box','sphere','cylinder','group','model'].includes(o.shape)||!vector(o.position)||!vector(o.size,.1,2000)||!color(o.color)||(o.rotation!==undefined&&!vector(o.rotation,-36000,36000))||!['solid','collectible','hazard','checkpoint','finish','decoration'].includes(o.behavior))throw Error('Invalid object: '+(o?.name||'unnamed'));objectExtensions(o);vehicleSettings(o.vehicle);if(o.vehicle&&(o.shape!=='box'||o.behavior!=='solid'||o.parentId||p.objects.some(c=>c.parentId===o.id)))throw Error('Vehicles must be root solid boxes without child objects.');materialSettings(o.material);validateComponents(o);if(o.modelUrl!=null){let u;try{u=new URL(o.modelUrl);}catch{throw Error('Invalid model URL');}if(u.protocol!=='https:'||u.username||u.password||o.modelUrl.length>2000)throw Error('Models require an HTTPS URL.');}if(o.physics&&(typeof o.physics.dynamic!=='boolean'||!Number.isFinite(o.physics.mass)||o.physics.mass<.1||o.physics.mass>100))throw Error('Invalid physics settings.');ids.add(o.id);}
 for(const o of p.objects)if(o.character&&p.objects.some(c=>c.parentId===o.id))throw Error('Characters cannot contain authored children.');worldTransforms(p.objects);for(const o of p.objects)if(o.physics?.dynamic&&p.objects.some(child=>child.parentId===o.id))throw Error('Dynamic bodies cannot be parents. Group static parts or use one rigid model.');
 for(const o of p.objects)if(o.interaction?.target&&!ids.has(o.interaction.target))throw Error('Interaction target does not exist: '+o.interaction.target);
 return {version:1,...foundationSettings(p),...(p.environment?{environment:environmentSettings(p.environment)}:{}),...(p.cameraMode?{cameraMode:p.cameraMode}:{}),...(p.gameMode?{gameMode:p.gameMode}:{}),...(p.script?{script:p.script}:{}),name:p.name,description:p.description,sky:p.sky,spawn:[...p.spawn],...(p.lighting?{lighting:validateLighting(p.lighting)}:{}),objects:p.objects.map(o=>({...validateComponents(o),...objectExtensions(o),...(o.vehicle?{vehicle:vehicleSettings(o.vehicle)}:{}),...(o.material?{material:materialSettings(o.material)}:{}),...(o.parentId!=null?{parentId:o.parentId}:{}),...(o.modelUrl?{modelUrl:o.modelUrl}:{}),...(o.physics?{physics:{dynamic:o.physics.dynamic,mass:o.physics.mass}}:{}),id:o.id,name:o.name,shape:o.shape,position:[...o.position],size:[...o.size],color:o.color,behavior:o.behavior,...(o.rotation?{rotation:[...o.rotation]}:{})}))};
}
export function starter(){return {version:1,name:'Skybound',description:'Collect the golden orbs. Jump between islands, reach the beacon, and make this world your own.',sky:'#a6cdd9',spawn:[0,2,8],objects:[{id:'island',name:'Starting island',shape:'box',position:[0,-1,5],size:[18,2,18],color:'#698b70',behavior:'solid'},...Array.from({length:5},(_,i)=>({id:'step'+i,name:'Floating island '+(i+1),shape:'box',position:[Math.sin(i*1.1)*5,i*.6,-9-i*8],size:[7,1.5,6],color:i%2?'#8ba28a':'#6d9288',behavior:'solid'})),...Array.from({length:5},(_,i)=>({id:'orb'+i,name:'Golden orb '+(i+1),shape:'sphere',position:[Math.sin(i*1.1)*5,2+i*.6,-9-i*8],size:[.8,.8,.8],color:'#ffcc66',behavior:'collectible'})),{id:'checkpoint',name:'Checkpoint',shape:'cylinder',position:[Math.sin(2.2)*5,2,-25],size:[2,.25,2],color:'#71e5bf',behavior:'checkpoint'},{id:'finish',name:'Finish beacon',shape:'cylinder',position:[Math.sin(4.4)*5,4,-41],size:[1,3,1],color:'#c3b2ff',behavior:'finish'},...[-1,1].flatMap((s,i)=>[{id:'trunk'+i,name:'Tree trunk',shape:'cylinder',position:[s*6,1,3],size:[.7,3,.7],color:'#716052',behavior:'solid'},{id:'crown'+i,name:'Tree canopy',shape:'sphere',position:[s*6,3.4,3],size:[4,4,4],color:'#456c58',behavior:'decoration'}])]};}

function validateLighting(l){if(!l||!Number.isFinite(l.intensity)||l.intensity<0||l.intensity>8||!Number.isFinite(l.ambient)||l.ambient<0||l.ambient>5)throw Error('Invalid lighting settings.');return {intensity:l.intensity,ambient:l.ambient};}
// Generation uses the extended format; older projects keep optional fields omitted.
schema.required.push('cameraMode','gameMode');
schema.properties.cameraMode={type:'string',enum:['first','third','top']};
schema.properties.gameMode={type:'string',enum:['freeplay','collectathon','race','shooter']};
const objectSchema=schema.properties.objects.items;
objectSchema.properties.shape.enum.push('group','model');
objectSchema.required.push('parentId','modelUrl','physics');
objectSchema.properties.parentId={type:['string','null']};
objectSchema.properties.modelUrl={type:['string','null']};
objectSchema.properties.physics={type:['object','null'],additionalProperties:false,required:['dynamic','mass'],properties:{dynamic:{type:'boolean'},mass:{type:'number',minimum:.1,maximum:100}}};
schema.required.push('environment');
schema.properties.environment={type:['object','null'],additionalProperties:false,required:['exposure','fogNear','fogFar','sunColor','sunPosition'],properties:{exposure:{type:'number',minimum:.1,maximum:3},fogNear:{type:'number',minimum:0,maximum:2999},fogFar:{type:'number',minimum:1,maximum:3000},sunColor:{type:'string'},sunPosition:{type:'array',items:{type:'number'},minItems:3,maxItems:3}}};
objectSchema.required.push('material');objectSchema.properties.material={type:['object','null'],additionalProperties:false,required:['roughness','metalness','emissive','emissiveIntensity'],properties:{roughness:{type:'number',minimum:0,maximum:1},metalness:{type:'number',minimum:0,maximum:1},emissive:{type:'string'},emissiveIntensity:{type:'number',minimum:0,maximum:10}}};

objectSchema.required.push('vehicle');objectSchema.properties.vehicle={type:['object','null'],additionalProperties:false,required:['mass','maxSpeed','engineForce'],properties:{mass:{type:'number',minimum:100,maximum:2000},maxSpeed:{type:'number',minimum:5,maximum:40},engineForce:{type:'number',minimum:200,maximum:5000}}};

objectSchema.properties.material.required.push('texture');objectSchema.properties.material.properties.texture={type:['string','null'],enum:['brick','grass','asphalt',null]};

extendFoundationSchema(schema);
// Match generation constraints to runtime validation, including colours and transform bounds.
schema.properties.sky.pattern='^#[0-9a-fA-F]{6}$';
schema.properties.spawn.items={type:'number',minimum:-10000,maximum:10000};
objectSchema.properties.color.pattern='^#[0-9a-fA-F]{6}$';
objectSchema.properties.position.items={type:'number',minimum:-10000,maximum:10000};
objectSchema.properties.size.items={type:'number',minimum:.1,maximum:2000};
objectSchema.properties.rotation.items={type:'number',minimum:-36000,maximum:36000};
schema.properties.name.maxLength=100;schema.properties.description.maxLength=3000;
objectSchema.properties.id.maxLength=100;objectSchema.properties.name.maxLength=100;
function constrainGeneratedColours(node){for(const [key,value] of Object.entries(node.properties||{})){if(['sky','color','emissive','sunColor','shirt','pants','skin','hair'].includes(key)&&value.type==='string')value.pattern='^#[0-9a-fA-F]{6}$';constrainGeneratedColours(value);}if(node.items)constrainGeneratedColours(node.items);}
constrainGeneratedColours(schema);
