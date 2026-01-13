// 3D Model Service for handling model paths and database integration

class Model3DService {
  constructor() {
    // Only include models that actually exist and have proper GLTF files
    this.modelMappings = {
      // MacBooks - Only use models with confirmed GLTF files
      'macbook pro m4': {
        folder: 'macbook_pro_m3_16_inch_2024',
        files: ['scene.gltf'],
        scale: 0.12,
        position: [0, -0.5, 0],
        rotation: [0, 0, 0]
      },
      'macbook m4': {
        folder: 'macbook_pro_m3_16_inch_2024',
        files: ['scene.gltf'],
        scale: 0.12,
        position: [0, -0.5, 0]
      },
      'macbook pro 2021': {
        folder: '2021_macbook_pro_16_m1_pro__m1_max',
        files: ['scene.gltf'],
        scale: 0.12,
        position: [0, -0.5, 0]
      },
      'macbook 2021': {
        folder: '2021_macbook_pro_16_m1_pro__m1_max',
        files: ['scene.gltf'],
        scale: 0.12,
        position: [0, -0.5, 0]
      },
      '2021 macbook pro 16': {
        folder: '2021_macbook_pro_16_m1_pro__m1_max',
        files: ['scene.gltf'],
        scale: 0.12,
        position: [0, -0.5, 0]
      },

      // iPhones - Note: Most iPhone models need conversion from FBX/ZIP to GLTF
      'iphone 17 pro': {
        folder: 'iphone-17-pro',
        files: ['source/iphone 17_4.glb'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'iphone 17 pro max': {
        folder: 'iphone_17_pro_max_model',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'apple iphone 17 pro max': {
        folder: 'iphone_17_pro_max_model',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'iphone 16 pro max': {
        folder: 'iphone_16_pro_max',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'iphone 16 pro': {
        folder: 'iphone_16_pro_max', // Use same model for now
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'iphone 16': {
        folder: 'iphone-16-free',
        files: ['source/1b338ec19f15ad72904b/1b338ec19f15ad72904b.gltf'],
        scale: 0.1,
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      },
      'iphone 17': {
        folder: 'iphone-16-free',
        files: ['source/1b338ec19f15ad72904b (1)/1b338ec19f15ad72904b (1).gltf'],
        scale: 0.1,
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      },
      'apple iphone 17': {
        folder: 'iphone-16-free',
        files: ['source/1b338ec19f15ad72904b (1)/1b338ec19f15ad72904b (1).gltf'],
        scale: 0.1,
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      },
      'iphone 15 pro max': {
        folder: 'iphone_15_pro_max',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'apple iphone 15 pro max': {
        folder: 'iphone_15_pro_max',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'iphone 15': {
        folder: 'iphone_15',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'apple iphone 15': {
        folder: 'iphone_15',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'iphone 14 pro': {
        folder: 'iphone-14-pro',
        files: ['source/model.zip'], // ZIP file - needs extraction and conversion
        scale: 0.1,
        position: [0, 0, 0],
        needsConversion: true
      },
      'iphone 14 pro max': {
        folder: 'iphone_14_pro_max',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'apple iphone 14 pro max': {
        folder: 'iphone_14_pro_max',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'iphone 14': {
        folder: 'iphone_14',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'apple iphone 14': {
        folder: 'iphone_14',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'iphone 13 pro max': {
        folder: 'apple_iphone_13_pro_max',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0],
        rotation: [0, 0, 0]
      },
      'iphone 13': {
         folder: 'iphone_13_concept',
         files: ['scene.gltf'],
         scale: 0.05,
         position: [0, 0, 0]
       },
       'apple iphone 13': {
         folder: 'iphone_13_concept',
         files: ['scene.gltf'],
         scale: 0.05,
         position: [0, 0, 0]
       },

      // Samsung Phones - Only use models with confirmed GLTF files
      'samsung galaxy s25': {
        folder: 'samsung-s25-ultra-free',
        files: ['source/samsung_s24_ultra.glb'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'samsung s25 ultra': {
        folder: 'samsung-s25-ultra-free',
        files: ['source/samsung_s24_ultra.glb'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'samsung s25': {
        folder: 'samsung-s25',
        files: ['source/SAMSUNG S25/SAMSUNG S25.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'samsung galaxy a14': {
        folder: 'SAMSUNG Galaxy A14 5G',
        files: ['SAMSUNG Galaxy A14 5G/GLTF/GLTF/SAMSUNG Galaxy A14 5G.gltf'],
        scale: 0.81,
        position: [0, 0, 0]
      },
      'galaxy a14': {
        folder: 'SAMSUNG Galaxy A14 5G',
        files: ['SAMSUNG Galaxy A14 5G/GLTF/GLTF/SAMSUNG Galaxy A14 5G.gltf'],
        scale: 0.81,
        position: [0, 0, 0]
      },
      // Explicit mappings to avoid incorrect fuzzy matches
      'samsung galaxy s23 ultra': {
        folder: 'samsung-s25-ultra-free',
        files: ['source/samsung_s24_ultra.glb'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      's23 ultra': {
        folder: 'samsung-s25-ultra-free',
        files: ['source/samsung_s24_ultra.glb'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      'samsung s24': {
        folder: 'samsung-s25',
        files: ['source/SAMSUNG S25/SAMSUNG S25.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      // Note: Other Samsung models don't have usable GLTF/GLB files
      // They contain ZIP/Blend files that need conversion

      // Gaming Laptops - Only use models with confirmed GLTF files
      'asus tuf gaming': {
        folder: 'asus_rog_strix_scar_17_2023_g733_gaming_laptop',
        files: ['scene.gltf'],
        scale: 0.12,
        position: [0, -0.5, 0]
      },
      'asus tuf f15': {
        folder: 'asus_rog_strix_scar_17_2023_g733_gaming_laptop',
        files: ['scene.gltf'],
        scale: 0.12,
        position: [0, -0.5, 0]
      },
      'asus rog strix': {
        folder: 'asus_rog_strix_scar_17_2023_g733_gaming_laptop',
        files: ['scene.gltf'],
        scale: 0.12,
        position: [0, -0.5, 0]
      },

      // HP Laptops
      'hp omen': {
        folder: 'hp_omen_laptop',
        files: ['scene.gltf', 'e.bin'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'hp 14s': {
        folder: 'hp_14s-dq2622tu_laptop',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'hp laptop 14s': {
        folder: 'hp_14s-dq2622tu_laptop',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },

      // Lenovo
      'lenovo ideapad': {
        folder: 'lenovo_ideapad',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0],
        rotation: [0, 0, 0]
      },
      'lenovo': {
        folder: 'lenovo',
        files: ['source/two283.fbx'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },

      // Acer
      'acer nitro 5': {
        folder: 'acer-nitro-5-laptop',
        files: ['source/Acer Nitro 5 AN515-57.glb'],
        scale: 0.25,
        position: [0, -0.5, 0]
      },
      'msi monitor 27': {
        folder: 'msi_optix_mag271cr_27',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'msi optix mag271cr 27': {
        folder: 'msi_optix_mag271cr_27',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'nvidia rtx 2070': {
        folder: 'geforce_rtx_2070_founders_edition',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'geforce rtx 2070': {
        folder: 'geforce_rtx_2070_founders_edition',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'nvidea rtx 2070': {
        folder: 'geforce_rtx_2070_founders_edition',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },

      'nvidia rtx 3060': {
        folder: 'geforce_rtx_3060_ti_founders_edition',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'geforce rtx 3060': {
        folder: 'geforce_rtx_3060_ti_founders_edition',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'nvidea rtx 3060': {
        folder: 'geforce_rtx_3060_ti_founders_edition',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },

      // Xiaomi - Only models with confirmed GLTF files
      'redmi note 14': {
        folder: 'redmi_note_14__realistic_smartphone_3d_model',
        files: ['scene.gltf'],
        scale: 0.1,
        position: [0, 0, 0]
      },
      // Note: xiaomi-redmi-12 and xiaomi-redmi-9t don't have usable GLTF files

      // Vivo
      'vivo x80': {
        folder: 'vivo-x80',
        files: ['source/vivo_x80without_extra_textures.glb'],
        scale: 0.1,
        position: [0, 0, 0]
      },

      // Consoles
      'nintendo switch': {
        folder: 'nintendo_switch',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },

      'ps5': {
        folder: 'ps5',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },

      'dual shock 5': {
        folder: 'playstation_5_dualsense',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'xbox controller': {
        folder: 'xbox_controller',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'xbox series x': {
        folder: 'xbox_one_s',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'dualshock 5': {
        folder: 'playstation_5_dualsense',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'dualshock 5 sony': {
        folder: 'playstation_5_dualsense',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'dualshock 4 sony': {
        folder: 'game_controller-_version_1',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'dualshock 4': {
        folder: 'game_controller-_version_1',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'dual shock 4': {
        folder: 'game_controller-_version_1',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },

      // PlayStation 4
      'sony playstation 4': {
        folder: 'ps4',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'playstation 4': {
        folder: 'ps4',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },
      'ps4': {
        folder: 'ps4',
        files: ['scene.gltf'],
        scale: 1.0,
        position: [0, -0.5, 0]
      },

      // Gaming PC
      'gaming pc': {
        folder: 'gaming-pc-with-animated-textures-that-wont-work',
        files: ['source/model.gltf'],
        scale: 1.0,
        position: [0, -1, 0]
      }
    };

    // Alternative search terms for better matching
    this.searchAliases = {
      'macbook': ['macbook pro', 'macbook air', 'mac book'],
      'iphone': ['apple iphone', 'iphone pro', 'iphone max'],
      'samsung': ['galaxy', 'samsung galaxy'],
      'asus': ['asus tuf', 'asus rog', 'tuf gaming'],
      'hp': ['hewlett packard', 'hp laptop'],
      'lenovo': ['thinkpad', 'ideapad'],
      'acer': ['acer laptop', 'nitro'],
      'xiaomi': ['redmi', 'mi'],
      'gaming': ['gaming laptop', 'gaming pc', 'gaming computer']
    };
  }

  /**
   * Get 3D model configuration for a gadget
   * @param {string} gadgetName - Name of the gadget
   * @param {string} gadgetBrand - Brand of the gadget
   * @param {string} gadgetModel - Model of the gadget
   * @returns {Object|null} Model configuration or null if not found
   */
  getModelConfig(gadgetName, gadgetBrand = '', gadgetModel = '') {
    const searchTerms = [
      gadgetName,
      `${gadgetBrand} ${gadgetModel}`,
      `${gadgetBrand} ${gadgetName}`,
      gadgetModel
    ].filter(Boolean);

    for (const term of searchTerms) {
      const normalizedTerm = this.normalizeSearchTerm(term);
      
      // Direct match
      if (this.modelMappings[normalizedTerm]) {
        return this.modelMappings[normalizedTerm];
      }

      // Fuzzy match
      const fuzzyMatch = this.findFuzzyMatch(normalizedTerm);
      if (fuzzyMatch) {
        return fuzzyMatch;
      }
    }

    return null;
  }

  /**
   * Normalize search term for better matching
   * @param {string} term - Search term
   * @returns {string} Normalized term
   */
  normalizeSearchTerm(term) {
    return term
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Find fuzzy match for a search term
   * @param {string} searchTerm - Normalized search term
   * @returns {Object|null} Model configuration or null
   */
  findFuzzyMatch(searchTerm) {
    const words = searchTerm.split(' ');

    // Detect brand/category hints to restrict fuzzy matching to relevant keys
    const brandTokens = ['macbook', 'iphone', 'apple', 'samsung', 'galaxy', 'asus', 'hp', 'lenovo', 'legion', 'acer', 'xiaomi', 'redmi', 'vivo', 'gaming'];
    const brandHints = brandTokens.filter(token => words.includes(token));

    const entries = Object.entries(this.modelMappings).filter(([key]) => {
      if (brandHints.length === 0) return true;
      const k = key.split(' ');
      return brandHints.some(hint => k.includes(hint));
    });

    for (const [key, config] of entries) {
      const keyWords = key.split(' ');

      const matchingWords = words.filter(word =>
        keyWords.some(keyWord => keyWord.includes(word) || word.includes(keyWord))
      );

      if (matchingWords.length >= Math.min(words.length, keyWords.length) * 0.7) {
        return config;
      }
    }

    return null;
  }

  /**
   * Get all available model paths for a gadget
   * @param {Object} modelConfig - Model configuration
   * @returns {Array} Array of possible model paths
   */
  getModelPaths(modelConfig) {
    if (!modelConfig) return [];

    const base = (process.env.REACT_APP_MODELS_BASE_URL || '/models_extracted').replace(/\/$/, '');
    const basePath = `${base}/${modelConfig.folder}`;
    const paths = [];

    for (let rawFile of modelConfig.files) {
      // Sanitize file names: trim and remove accidental trailing dots after extensions
      const file = String(rawFile)
        .trim()
        .replace(/(\.gltf|\.glb|\.obj)\.+$/i, '$1');
      // Prefer GLB over GLTF to avoid cross-origin sub-asset issues
      if (file.endsWith('.glb')) {
        paths.push(`${basePath}/${file}`);
      } else if (file.endsWith('.gltf')) {
        paths.push(`${basePath}/${file}`);
      } else if (file.endsWith('.obj')) {
        // Direct OBJ support
        paths.push(`${basePath}/${file}`);
      } else if (file.endsWith('.zip') || file.endsWith('.7z') || file.endsWith('.fbx')) {
        // For compressed or non-web formats, we'll need conversion
        // For now, try to find converted versions
        const convertedFile = file.replace(/\.(zip|7z|fbx)$/i, '.glb');
        paths.push(`${basePath}/${convertedFile}`);
        // Also include JSON variant as a secondary option
        const convertedJson = file.replace(/\.(zip|7z|fbx)$/i, '.gltf');
        paths.push(`${basePath}/${convertedJson}`);
      }
    }

    // Add common fallback paths (GLB first, then GLTF)
    paths.push(
      `${basePath}/scene.glb`,
      `${basePath}/model.glb`,
      `${basePath}/source/scene.glb`,
      `${basePath}/source/model.glb`
    );

    paths.push(
      `${basePath}/scene.gltf`,
      `${basePath}/model.gltf`,
      `${basePath}/source/scene.gltf`,
      `${basePath}/source/model.gltf`
    );

    // Remove duplicates
    return [...new Set(paths)];
  }

  /**
   * Check if a model file exists and is valid
   * @param {string} modelPath - Path to the model file
   * @returns {Promise<boolean>} Whether the file exists and is valid
   */
  async checkModelExists(modelPath) {
    try {
      if (!modelPath.endsWith('.gltf') && !modelPath.endsWith('.glb') && !modelPath.endsWith('.obj')) {
        return false;
      }

      // Prefer lightweight HEAD; avoid duplicate GETs that can clash with loader
      let response;
      try {
        let headUrl = modelPath;
        try {
          const u = new URL(modelPath);
          if (/sparkle-pro\.co\.uk$/i.test(u.hostname)) {
            const original = u.pathname + (u.search || '');
            const decoded = decodeURIComponent(original);
            const sanitized = decoded.replace(/(\.gltf|\.glb|\.obj)\.+$/i, '$1');
            headUrl = `https://${u.host}/api/models-proxy?url=${encodeURIComponent(sanitized)}`;
          }
        } catch (_) {
          // modelPath may be relative; leave as-is
        }
        response = await fetch(headUrl, { method: 'HEAD', mode: 'cors', cache: 'no-store' });
      } catch (headErr) {
        return false;
      }

      if (!response.ok) return false;

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate model configuration
   * @param {Object} modelConfig - Model configuration object
   * @returns {boolean} Whether the configuration is valid
   */
  validateModelConfig(modelConfig) {
    if (!modelConfig || !modelConfig.folder || !modelConfig.files) {
      return false;
    }

    // Check if any files are valid GLTF/GLB/OBJ
    const hasValidFiles = modelConfig.files.some(file => 
      file.endsWith('.gltf') || file.endsWith('.glb') || file.endsWith('.obj')
    );

    if (!hasValidFiles) {
      console.warn(`No valid GLTF/GLB files in model config:`, modelConfig);
      return false;
    }

    return true;
  }

  /**
   * Get the best available model path for a gadget
   * @param {string} gadgetName - Name of the gadget
   * @param {string} gadgetBrand - Brand of the gadget
   * @param {string} gadgetModel - Model of the gadget
   * @returns {Promise<Object|null>} Model info with path and config
   */
  async getBestModelPath(gadgetName, gadgetBrand = '', gadgetModel = '') {
    try {
      const modelConfig = this.getModelConfig(gadgetName, gadgetBrand, gadgetModel);
      
      if (!modelConfig) {
        console.log(`No model configuration found for: ${gadgetName}`);
        return null;
      }

      // Validate the model configuration
      if (!this.validateModelConfig(modelConfig)) {
        console.warn(`Invalid model configuration for: ${gadgetName}`);
        return null;
      }

      // If the model needs conversion (FBX, ZIP, 7z files), return null to fall back to 2D
      if (modelConfig.needsConversion) {
        console.log(`Model for "${gadgetName}" needs conversion from FBX/ZIP/7z to GLTF format. Falling back to 2D image.`);
        return null;
      }

      const possiblePaths = this.getModelPaths(modelConfig);
      
      // Filter to only supported 3D files
      const validPaths = possiblePaths.filter(path => 
        path.endsWith('.gltf') || path.endsWith('.glb') || path.endsWith('.obj')
      );

      if (validPaths.length === 0) {
        console.warn(`No valid GLTF/GLB files found for: ${gadgetName}`);
        return null;
      }
      
      for (const path of validPaths) {
        const exists = await this.checkModelExists(path);
        if (exists) {
          console.log(`Found valid 3D model for "${gadgetName}": ${path}`);
          return {
            path,
            config: modelConfig,
            scale: modelConfig.scale || 1,
            position: modelConfig.position || [0, 0, 0],
            rotation: modelConfig.rotation || [0, 0, 0]
          };
        }
      }

      console.warn(`No accessible 3D model files found for: ${gadgetName}`);
      return null;
    } catch (error) {
      console.error(`Error getting model path for "${gadgetName}":`, error);
      return null;
    }
  }

  /**
   * Get all gadgets that have 3D models available
   * @returns {Array} Array of gadget names with 3D models
   */
  getAvailableModels() {
    return Object.keys(this.modelMappings);
  }

  /**
   * Search for gadgets with 3D models
   * @param {string} query - Search query
   * @returns {Array} Array of matching gadget names
   */
  searchModels(query) {
    const normalizedQuery = this.normalizeSearchTerm(query);
    const queryWords = normalizedQuery.split(' ');
    
    return Object.keys(this.modelMappings).filter(gadgetName => {
      const normalizedName = this.normalizeSearchTerm(gadgetName);
      return queryWords.some(word => normalizedName.includes(word));
    });
  }

  /**
   * Update model mapping from database
   * @param {Array} gadgets - Array of gadgets from database
   */
  updateMappingsFromDatabase(gadgets) {
    // This method can be used to dynamically update mappings
    // based on database entries with 3D model information
    gadgets.forEach(gadget => {
      if (gadget.has_3d_model && gadget.model3d_path) {
        const key = this.normalizeSearchTerm(gadget.name);
        this.modelMappings[key] = {
          folder: gadget.model3d_path,
          files: Array.isArray(gadget.model3d_files) ? gadget.model3d_files : ['scene.gltf'],
          scale: gadget.model3d_scale || 1,
          position: Array.isArray(gadget.model3d_position) ? gadget.model3d_position : [0, 0, 0],
          rotation: Array.isArray(gadget.model3d_rotation) ? gadget.model3d_rotation : [0, 0, 0],
          config: gadget.model3d_config || {}
        };
        
        // Also add brand + model combinations
        if (gadget.brand && gadget.model) {
          const brandModelKey = this.normalizeSearchTerm(`${gadget.brand} ${gadget.model}`);
          this.modelMappings[brandModelKey] = this.modelMappings[key];
        }
      }
    });
  }

  /**
   * Get gadget 3D model info from database format
   * @param {Object} gadget - Gadget object from database
   * @returns {Object|null} Model configuration or null if not available
   */
  getModelConfigFromGadget(gadget) {
    if (!gadget || !gadget.has_3d_model || !gadget.model3d_path) {
      return null;
    }

    return {
      folder: gadget.model3d_path,
      files: Array.isArray(gadget.model3d_files) ? gadget.model3d_files : ['scene.gltf'],
      scale: gadget.model3d_scale || 1,
      position: Array.isArray(gadget.model3d_position) ? gadget.model3d_position : [0, 0, 0],
      rotation: Array.isArray(gadget.model3d_rotation) ? gadget.model3d_rotation : [0, 0, 0],
      config: gadget.model3d_config || {}
    };
  }

  /**
   * Check if gadget has 3D model support
   * @param {Object} gadget - Gadget object from database
   * @returns {boolean} Whether gadget has 3D model
   */
  hasModel(gadget) {
    return gadget && gadget.has_3d_model && gadget.model3d_path;
  }
}

// Create singleton instance
const model3DService = new Model3DService();

export default model3DService;