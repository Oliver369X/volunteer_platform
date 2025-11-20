#!/usr/bin/env node
'use strict';

/**
 * Script para probar integraciones de Cloudinary, Pinata y Gemini
 * Uso: node test-integrations.js
 */

require('dotenv').config();
const cloudinaryClient = require('./src/services/cloudinary-client');
const pinataClient = require('./src/services/pinata-client');
const badgeGenerator = require('./src/services/badge-generator');
const geminiClient = require('./src/services/gemini-client');

console.log('\n🧪 ================================================');
console.log('🧪 PRUEBA DE INTEGRACIONES');
console.log('🧪 ================================================\n');

async function testGemini() {
  console.log('🤖 Test 1: Gemini AI\n');
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('   ⚠️  GEMINI_API_KEY no configurado');
    return false;
  }
  
  try {
    console.log('   → Generando descripción de badge...');
    const description = await geminiClient.generateBadgeDescription({
      name: 'Héroe Humanitario',
      level: 'ORO',
      category: 'Salud',
      achievement: 'Completar 10 misiones críticas',
    });
    console.log(`   ✅ Descripción generada: "${description}"\n`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function testCloudinary() {
  console.log('☁️  Test 2: Cloudinary\n');
  
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('   ⚠️  Cloudinary no configurado');
    return false;
  }
  
  try {
    // Crear un buffer de imagen de prueba (1x1 pixel rojo en PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
      'base64'
    );
    
    console.log('   → Subiendo imagen de prueba...');
    const result = await cloudinaryClient.uploadImage(testImageBuffer, {
      folder: 'volunteer-platform/test',
      public_id: `test_${Date.now()}`,
    });
    
    console.log(`   ✅ Imagen subida exitosamente!`);
    console.log(`   📍 URL: ${result.url}`);
    console.log(`   🆔 Public ID: ${result.public_id}\n`);
    
    // Eliminar imagen de prueba
    await cloudinaryClient.deleteImage(result.public_id);
    console.log('   🗑️  Imagen de prueba eliminada\n');
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function testPinata() {
  console.log('📌 Test 3: Pinata (IPFS)\n');
  
  if (!process.env.PINATA_JWT) {
    console.log('   ⚠️  PINATA_JWT no configurado');
    return false;
  }
  
  try {
    const testMetadata = {
      name: 'Test Badge NFT',
      description: 'Badge de prueba para verificar integración con Pinata/IPFS',
      image: 'https://via.placeholder.com/512/FFD700/000000?text=TEST',
      attributes: [
        { trait_type: 'Level', value: 'TEST' },
        { trait_type: 'Timestamp', value: new Date().toISOString() },
      ],
    };
    
    console.log('   → Subiendo metadata de prueba a IPFS...');
    const result = await pinataClient.pinJSON(testMetadata, `test-badge-${Date.now()}`);
    
    if (result) {
      console.log(`   ✅ Metadata subido exitosamente!`);
      console.log(`   🔗 IPFS Hash: ${result.ipfsHash}`);
      console.log(`   🌐 Gateway URL: ${result.gatewayUrl}`);
      console.log(`   ⏰ Timestamp: ${result.timestamp}\n`);
      
      // Desanclar archivo de prueba
      await pinataClient.unpin(result.ipfsHash);
      console.log('   🗑️  Archivo de prueba despineado de IPFS\n');
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function testFullBadgeNFTFlow() {
  console.log('🏆 Test 4: Flujo Completo de Badge NFT\n');
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.PINATA_JWT) {
    console.log('   ⚠️  Se requiere Cloudinary Y Pinata configurados');
    return false;
  }
  
  try {
    console.log('   → Generando badge completo con IA...');
    
    const badgeInfo = {
      name: 'Test Héroe Humanitario',
      level: 'ORO',
      code: 'TEST_HERO',
      category: 'Salud',
      achievement: 'Completar 10 misiones críticas de salud',
    };
    
    // Generar badge con IA
    const generatedBadge = await badgeGenerator.generateBadge(badgeInfo);
    console.log(`   ✅ Badge generado:`);
    console.log(`      📝 Descripción: ${generatedBadge.description}`);
    console.log(`      🖼️  Imagen URL: ${generatedBadge.imageUrl}`);
    
    // Crear metadata NFT completa
    const nftMetadata = {
      name: badgeInfo.name,
      description: generatedBadge.description,
      image: generatedBadge.imageUrl,
      external_url: `https://lacausa.org/badges/${badgeInfo.code}`,
      attributes: [
        { trait_type: 'Badge Code', value: badgeInfo.code },
        { trait_type: 'Level', value: badgeInfo.level },
        { trait_type: 'Category', value: badgeInfo.category },
        { trait_type: 'Generated With', value: generatedBadge.metadata?.generatedWith || 'AI' },
        { trait_type: 'Test', value: 'true' },
      ],
    };
    
    // Subir metadata a IPFS
    console.log('\n   → Subiendo metadata completa a IPFS/Pinata...');
    const ipfsResult = await pinataClient.pinJSON(
      nftMetadata,
      `test-nft-complete-${Date.now()}`
    );
    
    if (ipfsResult) {
      console.log(`   ✅ NFT Badge completo creado!`);
      console.log(`   🔗 IPFS Hash: ${ipfsResult.ipfsHash}`);
      console.log(`   🌐 Gateway URL: ${ipfsResult.gatewayUrl}`);
      console.log(`   🎨 Imagen: ${nftMetadata.image}`);
      console.log(`   📝 Descripción: ${nftMetadata.description}\n`);
      
      console.log('   🎉 ¡Puedes ver el NFT en:');
      console.log(`   👉 ${ipfsResult.gatewayUrl}\n`);
      
      // Limpiar
      setTimeout(async () => {
        await pinataClient.unpin(ipfsResult.ipfsHash);
        console.log('   🗑️  Test NFT despineado\n');
      }, 5000);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('📋 Configuración detectada:');
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   CLOUDINARY: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   PINATA_JWT: ${process.env.PINATA_JWT ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`   REPLICATE_API_KEY: ${process.env.REPLICATE_API_KEY ? '✅ Configurado' : '⚠️  No configurado (opcional)'}`);
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Configurado' : '⚠️  No configurado (opcional)'}\n`);
  
  console.log('🚀 Iniciando pruebas...\n');
  console.log('================================================\n');
  
  const results = {
    gemini: await testGemini(),
    cloudinary: await testCloudinary(),
    pinata: await testPinata(),
  };
  
  console.log('================================================\n');
  console.log('📊 RESUMEN DE PRUEBAS:\n');
  console.log(`   Gemini AI:   ${results.gemini ? '✅ PASÓ' : '❌ FALLÓ'}`);
  console.log(`   Cloudinary:  ${results.cloudinary ? '✅ PASÓ' : '❌ FALLÓ'}`);
  console.log(`   Pinata IPFS: ${results.pinata ? '✅ PASÓ' : '❌ FALLÓ'}\n`);
  
  if (results.cloudinary && results.pinata) {
    console.log('🎨 Ejecutando test completo de NFT...\n');
    console.log('================================================\n');
    const fullTest = await testFullBadgeNFTFlow();
    console.log('================================================\n');
    console.log(`   Badge NFT Completo: ${fullTest ? '✅ PASÓ' : '❌ FALLÓ'}\n`);
  }
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('================================================');
  if (allPassed) {
    console.log('🎉 ¡TODAS LAS INTEGRACIONES FUNCIONAN! 🎉');
  } else {
    console.log('⚠️  Algunas integraciones fallaron. Revisar configuración.');
  }
  console.log('================================================\n');
  
  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

