import {core, app, action, constants, imaging} from 'photoshop';
import {BOUNDS, IMAGENERATOR_CONFIG, INPAINTINGCONFIG} from './props';
import {FRCONFIG} from '../panels/FaceRestorePanel';
import {sendWorkflowDataToServer} from './ServerUtils';
import {generateRandomName} from './IOUtils';
const fs = require('uxp').storage.localFileSystem;

export const saveAsPng = (path: any) => {
  return {
    _obj: 'save',
    as: {
      _obj: 'PNGFormat',
      method: {
        _enum: 'PNGMethod',
        _value: 'moderate',
      },
      embedIccProfileLastState: {
        _enum: 'embedOff',
        _value: 'embedOff',
      },
    },
    in: {
      _path: path,
      _kind: 'local',
    },
    copy: true,
    lowerCase: true,
    embedProfiles: false,
    saveStage: {
      _enum: 'saveStageType',
      _value: 'saveBegin',
    },
  };
};

async function UNDO() {
  return await action.batchPlay(
    [
      {
        _obj: 'select',
        _target: [
          {
            _ref: 'historyState',
            _enum: 'ordinal',
            _value: 'previous',
          },
        ],
      },
    ],
    {}
  );
}
async function toggleVisible() {
  return action.batchPlay(
    [
      {
        _obj: 'show',
        null: [
          {
            _ref: 'layer',
            _enum: 'ordinal',
            _value: 'targetEnum',
          },
        ],
        toggleOptionsPalette: true,
      },
    ],
    {}
  );
}
export function executeFaceRestore(type: string, IOFolder: any, frconfig: FRCONFIG, uuid: string) {
  core
    .executeAsModal(
      async (_executionContext, descriptor: object) => {
        let hostControl = _executionContext.hostControl;
        let documentID = app.activeDocument.id;
        let suspensionID = await hostControl.suspendHistory({
          documentID: documentID,
          name: 'DoStuff',
        });
        const selected = type == 'selected';

        if (selected) {
          await action.batchPlay(
            [
              {
                _obj: 'crop',
                delete: true,
              },
            ],
            {}
          );
        }
        //hide all
        if (!selected) await toggleVisible();

        const rand_name = generateRandomName();
        const newFile = await IOFolder?.input?.createFile(rand_name, {overwrite: true});
        const png = await fs.createSessionToken(newFile);
        const result = await action.batchPlay([saveAsPng(png)], {});

        //show them all back
        if (!selected) await toggleVisible();

        let new_name = result[0].in._path;
        new_name = new_name.substring(new_name.lastIndexOf('\\') + 1);
        const workflow = FaceRestoreWorkflow(new_name, frconfig);
        sendWorkflowDataToServer(workflow, uuid);

        await hostControl.resumeHistory(suspensionID, true);
        if (selected) await UNDO();
      },
      {commandName: 'execute facerestore'}
    )
    .catch((e) => {
      console.log(e);
    });
}
export async function downloadImage(IOFolder: any, buffer: any, filetype: string, node_name?: string) {
  return await core
    .executeAsModal(
      async (_executionContext, descriptor: object) => {
        let hostControl = _executionContext.hostControl;
        let documentID = app.activeDocument.id;
        let suspensionID = await hostControl.suspendHistory({
          documentID: documentID,
          name: 'downloadImage',
        });

        let rand_name = generateRandomName(filetype);
        if (node_name) rand_name = node_name + '_' + rand_name;
        const newJPG = await IOFolder?.input?.createFile(rand_name, {overwrite: true});
        await newJPG.write(buffer, {format: require('uxp').storage.formats.binary});
        await hostControl.resumeHistory(suspensionID, true);

        return rand_name;
      },
      {commandName: 'downloading Image from url'}
    )
    .catch((e) => console.log(e));
}

export async function saveSelectionToImage(bounds: BOUNDS, IOFolder: any, node_name?: string) {
  const notselected = bounds.left == 0 && bounds.right == 0;
  if (notselected) return null;
  return await core.executeAsModal(
    async (_executionContext, descriptor: object) => {
      let hostControl = _executionContext.hostControl;
      let documentID = app.activeDocument.id;
      let suspensionID = await hostControl.suspendHistory({
        documentID: documentID,
        name: 'saveSelectionToImage',
      });

      await action.batchPlay(
        [
          {
            _obj: 'crop',
            delete: true,
          },
        ],
        {}
      );
      let rand_name = generateRandomName();
      if (node_name) rand_name = node_name + '_' + rand_name;
      const newJPG = await IOFolder?.input?.createFile(rand_name, {overwrite: true});
      const png = await fs.createSessionToken(newJPG);
      const result = await action.batchPlay([saveAsPng(png)], {});
      let new_name = result[0].in._path;
      new_name = new_name.substring(new_name.lastIndexOf('\\') + 1);
      await hostControl.resumeHistory(suspensionID, true);
      await UNDO();

      return new_name;
    },
    {commandName: 'save selection to image file'}
  );
}

export function executeInpainting(IOFolder: any, config: FRCONFIG, inpaintingconfig: INPAINTINGCONFIG, bounds: BOUNDS, uuid: string) {
  core
    .executeAsModal(
      async (_executionContext, descriptor: object) => {
        let hostControl = _executionContext.hostControl;
        let documentID = app.activeDocument.id;
        let suspensionID = await hostControl.suspendHistory({
          documentID: documentID,
          name: 'DoStuff',
        });
        const rand_name = generateRandomName();
        let new_name = '_';
        const notselected = bounds.left == 0 && bounds.right == 0;

        if (notselected) {
          await action.batchPlay(
            [
              {
                _obj: 'set',
                _target: [
                  {
                    _ref: 'channel',
                    _property: 'selection',
                  },
                ],
                to: {
                  _enum: 'ordinal',
                  _value: 'allEnum',
                },
              },
            ],
            {}
          );
        }

        await action.batchPlay(
          [
            {
              _obj: 'crop',
              delete: true,
            },
          ],
          {}
        );
        const newJPG = await IOFolder?.input?.createFile(rand_name, {overwrite: true});
        const png = await fs.createSessionToken(newJPG);
        const result = await action.batchPlay([saveAsPng(png)], {});
        new_name = result[0].in._path;
        new_name = new_name.substring(new_name.lastIndexOf('\\') + 1);
        const workflow = WFInpainting(new_name, config, inpaintingconfig);
        sendWorkflowDataToServer(workflow, uuid);
        await hostControl.resumeHistory(suspensionID, true);
        if (!notselected) await UNDO();
      },
      {commandName: 'execute INPAINTING Workflow'}
    )
    .catch((e) => console.log(e));
}

/**
 *
 * @param imagename
 * @param outputFolder
 * @param selectionBounds
 */
export function placeImageOnCanvas(imagename: string, outputFolder: any, selectionBounds: BOUNDS, resizeme?: boolean) {
  core.executeAsModal(
    async () => {
      const outputEntry = await outputFolder?.output?.getEntry(imagename);
      const filepath = await fs.createSessionToken(outputEntry);
      await action
        .batchPlay(
          [
            {
              _obj: 'placeEvent',
              null: {
                _path: filepath,
                _kind: 'local',
              },
              linked: true,
            },
          ],
          {}
        )
        .catch((e) => console.log(e));
      if (imagename.includes('RemBG')) {
        await action
          .batchPlay(
            [
              {
                _obj: 'set',
                _target: [
                  {
                    _ref: 'channel',
                    _property: 'selection',
                  },
                ],
                to: {
                  _ref: 'channel',
                  _enum: 'channel',
                  _value: 'transparencyEnum',
                },
                invert: false,
              },
              {
                _obj: 'delete',
                _target: [
                  {
                    _ref: 'layer',
                    _enum: 'ordinal',
                    _value: 'targetEnum',
                  },
                ],
              },
              {
                _obj: 'make',
                new: {
                  _class: 'channel',
                },
                at: {
                  _ref: 'channel',
                  _enum: 'channel',
                  _value: 'mask',
                },
                using: {
                  _enum: 'userMaskEnabled',
                  _value: 'revealSelection',
                },
              },
            ],
            {}
          )
          .catch((e) => console.log());
      }
      if (!resizeme) {
        const sourcewidth: number = selectionBounds.right - selectionBounds.left;
        const sourceheight = selectionBounds.bottom - selectionBounds.top;
        const layer = app.activeDocument.activeLayers[0].boundsNoEffects;
        const curwidth: number = layer.width;
        const curheight = layer.height;
        //const percentage = (sourcewidth / curwidth) * 100;
        const percentage = (sourceheight / curheight) * 100;
        await app.activeDocument.activeLayers[0].scale(percentage, percentage, constants.AnchorPosition.MIDDLECENTER);
      }
    },
    {commandName: 'place Event'}
  );
}

/**
 *
 * @param namafile
 * @param config
 * @returns
 */
export const FaceRestoreWorkflow = (namafile: string, config: FRCONFIG) => {
  return {
    '1': {
      inputs: {
        image: namafile,
        'choose file to upload': 'image',
      },
      class_type: 'LoadImage',
    },
    '2': {
      inputs: {
        facerestore_model: config.facerestore_model,
        face_detection: 'retinaface_resnet50',
        center_face_only: config.centerface_only,
        restore_only: config.restore_only,
        upscale_only: config.upscale_only,
        method: config.method,
        upscale_model: config.upscale_model,
        image: ['1', 0],
      },
      class_type: 'FaceRestore',
    },
    '3': {
      inputs: {
        filename_prefix: 'FaceRestore',
        images: ['2', 0],
      },
      class_type: 'SaveImage',
    },
  };
};

export const WFInpainting = (namafile: string, restore: FRCONFIG, ipconfig: INPAINTINGCONFIG) => {
  return {
    '3': {
      inputs: {
        seed: ipconfig.seed,
        steps: ipconfig.steps,
        cfg: ipconfig.cfg,
        sampler_name: ipconfig.sampler_name,
        scheduler: ipconfig.scheduler,
        denoise: ipconfig.denoise,
        model: ['4', 0],
        positive: ['6', 0],
        negative: ['7', 0],
        latent_image: ['11', 0],
      },
      class_type: 'KSampler',
    },
    '4': {
      inputs: {
        ckpt_name: ipconfig.ckpt_name,
      },
      class_type: 'CheckpointLoaderSimple',
    },
    '6': {
      inputs: {
        text: ipconfig.text_positive,
        clip: ['4', 1],
      },
      class_type: 'CLIPTextEncode',
    },
    '7': {
      inputs: {
        text: ipconfig.text_negative,
        clip: ['4', 1],
      },
      class_type: 'CLIPTextEncode',
    },
    '8': {
      inputs: {
        samples: ['3', 0],
        vae: ['4', 2],
      },
      class_type: 'VAEDecode',
    },
    '9': {
      inputs: {
        filename_prefix: 'INPAINTING-',
        images: ['12', 0],
      },
      class_type: 'SaveImage',
    },
    '10': {
      inputs: {
        image: namafile,
        method: ipconfig.image_method,
        value: ipconfig.image_value,
        'choose file to upload': 'image',
      },
      class_type: 'LoadResizeImageMask',
    },
    '11': {
      inputs: {
        grow_mask_by: ipconfig.grow_mask_by,
        pixels: ['10', 0],
        vae: ['4', 2],
        mask: ['10', 1],
      },
      class_type: 'VAEEncodeForInpaint',
    },
    '12': {
      inputs: {
        facerestore_model: restore.facerestore_model,
        face_detection: 'retinaface_resnet50',
        center_face_only: restore.centerface_only,
        restore_only: restore.restore_only,
        upscale_only: restore.upscale_only,
        method: restore.method,
        upscale_model: restore.upscale_model,
        image: ['8', 0],
      },
      class_type: 'FaceRestore',
    },
  };
};

export function executeImageGenerator(is_scale: boolean, scale_mult: number, imgenconfig: IMAGENERATOR_CONFIG, uuid: string) {
  const workflow = ImageGenerator(is_scale, scale_mult, imgenconfig);

  sendWorkflowDataToServer(workflow, uuid);
}
export const ImageGenerator = (upscale: boolean, scale_mult: number, conf: IMAGENERATOR_CONFIG) => {
  const _prefix = 'IMAGEN_';

  return {
    '1': {
      inputs: {
        ckpt_name: conf.ckpt_name,
      },
      class_type: 'CheckpointLoaderSimple',
    },
    '2': {
      inputs: {
        seed: conf.ksampler.seed,
        steps: conf.ksampler.steps,
        cfg: conf.ksampler.cfg,
        sampler_name: conf.ksampler.sampler_name,
        scheduler: conf.ksampler.scheduler,
        denoise: conf.ksampler.denoise,
        model: ['1', 0],
        positive: ['4', 0],
        negative: ['5', 0],
        latent_image: ['6', 0],
      },
      class_type: 'KSampler',
    },
    '3': {
      inputs: {
        samples: ['2', 0],
        vae: ['1', 2],
      },
      class_type: 'VAEDecode',
    },
    '4': {
      inputs: {
        text: conf.text_positive,
        clip: ['1', 1],
      },
      class_type: 'CLIPTextEncode',
    },
    '5': {
      inputs: {
        text: conf.text_negative,
        clip: ['1', 1],
      },
      class_type: 'CLIPTextEncode',
    },
    '6': {
      inputs: {
        width: conf.image_width,
        height: conf.image_height,
        batch_size: 1,
      },
      class_type: 'EmptyLatentImage',
    },
    '10': {
      inputs: {
        filename_prefix: _prefix,
        images: [upscale ? '16' : '3', 0],
      },
      class_type: 'SaveImage',
    },
    '11': {
      inputs: {
        upscale_model: ['12', 0],
        image: [upscale ? '3' : '', 0],
      },
      class_type: 'ImageUpscaleWithModel',
    },
    '12': {
      inputs: {
        model_name: conf.upscale_model,
      },
      class_type: 'UpscaleModelLoader',
    },
    '13': {
      inputs: {
        pixels: ['15', 0],
        vae: ['1', 2],
      },
      class_type: 'VAEEncode',
    },
    '14': {
      inputs: {
        seed: conf.ksampler_upscale.seed,
        steps: conf.ksampler_upscale.steps,
        cfg: conf.ksampler_upscale.cfg,
        sampler_name: conf.ksampler_upscale.sampler_name,
        scheduler: conf.ksampler_upscale.scheduler,
        denoise: conf.ksampler_upscale.denoise,
        model: ['1', 0],
        positive: ['4', 0],
        negative: ['5', 0],
        latent_image: ['13', 0],
      },
      class_type: 'KSampler',
    },
    '15': {
      inputs: {
        upscale_method: 'nearest-exact',
        width: conf.image_width * scale_mult,
        height: conf.image_height * scale_mult,
        crop: 'disabled',
        image: ['11', 0],
      },
      class_type: 'ImageScale',
    },
    '16': {
      inputs: {
        samples: ['14', 0],
        vae: ['1', 2],
      },
      class_type: 'VAEDecode',
    },
  };
};
