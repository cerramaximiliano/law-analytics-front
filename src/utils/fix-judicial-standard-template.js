const fs = require("fs");
const path = require("path");

// Read existing templates
const templatesPath = path.join(__dirname, "../data/promotionalEmailTemplates.json");
const templates = JSON.parse(fs.readFileSync(templatesPath, "utf8"));

// Find the judicial standard template
const templateIndex = templates.findIndex((t) => t.name === "promo_12_judicial_standard_subscription");

if (templateIndex === -1) {
	console.error("Template not found");
	process.exit(1);
}

// Update the template with fixes
templates[
	templateIndex
].htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Suscripción STANDARD - Sincronización Judicial | Law||Analytics</title><style>.integration-benefit { width: 100% !important; margin-bottom: 15px !important; box-sizing: border-box !important; } .plan-card { width: 100% !important; margin-bottom: 20px !important; } .hero-image { height: auto !important; } .feature-container, .feature-grid { display: block !important; } .feature-item, .feature-box, .benefit-card, .pro-feature, .metric-card { width: 100% !important; margin-bottom: 15px !important; box-sizing: border-box !important; max-width: 100% !important; display: block !important; } .comparison-column { width: 100% !important; margin-bottom: 20px !important; } .timeline-item { flex-direction: column !important; } .cta-button { width: 100% !important; box-sizing: border-box !important; display: block !important; margin: 0 auto !important; padding-left: 10px !important; padding-right: 10px !important; } .image-showcase { width: 100% !important; } .step-number { margin-right: 15px !important; margin-bottom: 0 !important; } .integration-step { flex-direction: row !important; align-items: flex-start !important; } .step-circle { width: 30px !important; height: 30px !important; min-width: 30px !important; flex-shrink: 0 !important; } div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; } div[style*="display: flex"] { flex-wrap: wrap !important; } table, thead, tbody, th, td, tr { display: block !important; width: 100% !important; } img { max-width: 100% !important; height: auto !important; } @media only screen and (max-width: 600px) { /* Container fixes */ .container { width: 100% !important; max-width: 100% !important; padding: 15px !important; box-sizing: border-box !important; } /* Layout fixes */ .hero-image { height: auto !important; min-height: 150px !important; } /* Grid and flex fixes */ .feature-container, .feature-grid, .grid { display: block !important; grid-template-columns: 1fr !important; } div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; } div[style*="display: flex"] { flex-wrap: wrap !important; } /* Component fixes */ .feature-item, .feature-box, .benefit-card, .pro-feature, .metric-card, .benefit-item, .comparison-column, .image-showcase, .integration-benefit { width: 100% !important; max-width: 100% !important; margin-bottom: 15px !important; box-sizing: border-box !important; padding: 15px !important; } .timeline-item, .integration-step { text-align: left !important; } .step-number { margin-right: 10px !important; margin-bottom: 0 !important; } /* Button fixes */ .cta-button, a.cta-button { width: 90% !important; max-width: 300px !important; margin: 0 auto !important; display: block !important; padding: 12px 20px !important; box-sizing: border-box !important; font-size: 16px !important; } /* Table fixes */ table { width: 100% !important; } th, td { display: block !important; width: 100% !important; text-align: left !important; padding: 10px !important; } tr { border-bottom: 1px solid #ddd !important; } /* Image fixes */ img { max-width: 100% !important; height: auto !important; } /* Typography fixes */ h1 { font-size: 24px !important; } h2 { font-size: 20px !important; } h3 { font-size: 18px !important; } h4 { font-size: 16px !important; } p { font-size: 14px !important; } /* Special components */ .countdown-item { padding: 10px !important; font-size: 14px !important; } .comparison-table { font-size: 12px !important; } }</style></head><body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #333; background-color: #f5f7fa"><div class="container" style="max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 3px 10px rgba(0,0,0,0.05); box-sizing: border-box; width: 100%"><!-- Header --><div style="text-align: center; margin-bottom: 25px"><img src="https://res.cloudinary.com/dqyoeolib/image/upload/v1746261520/gzemrcj26etf5n6t1dmw.png" alt="Law||Analytics Logo" style="max-width: 200px; height: auto"/></div><!-- Hero Section with Judicial Integration --><div style="background-color: #222E43; padding: 40px 30px; border-radius: 12px; text-align: center; color: white; margin-bottom: 30px;"><div style="margin-bottom: 20px"><img src="https://res.cloudinary.com/dqyoeolib/image/upload/v1746884259/xndhymcmzv3kk0f62v0y.png" alt="Poder Judicial de la Nación" style="max-width: 120px; height: auto"/></div><h1 style="margin: 0 0 15px 0; font-size: 28px; font-weight: 700;">Plan STANDARD</h1><p style="margin: 0; font-size: 20px; opacity: 0.9">Sincronización diaria con el Poder Judicial de la Nación</p></div><!-- Content --><div style="margin-bottom: 30px;"><p style="font-size: 17px; line-height: 1.6; margin-bottom: 20px"> Estimado profesional del derecho, </p><p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px"> Con nuestra suscripción <strong>STANDARD</strong>, accedes a la sincronización automática diaria de todos tus expedientes con el Poder Judicial de la Nación. Una sola inversión que transforma completamente tu práctica legal. </p></div><!-- Key Feature Highlight --><div style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); padding: 30px 20px; border-radius: 12px; margin-bottom: 30px; text-align: center"><h2 style="color: #1e40af; margin: 0 0 20px 0; font-size: 24px">🔄 Sincronización Judicial Automática</h2><p style="margin: 0 0 25px 0; font-size: 16px; color: #1e293b">Mantén todos tus expedientes actualizados sin esfuerzo manual</p><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; padding: 0 10px;"><div class="integration-benefit" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); box-sizing: border-box;"><div style="font-size: 32px; margin-bottom: 10px">📥</div><h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px">Actualización Diaria</h4><p style="margin: 0; font-size: 14px; color: #475569">Sincronización automática cada 24 horas de todos tus expedientes</p></div><div class="integration-benefit" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); box-sizing: border-box;"><div style="font-size: 32px; margin-bottom: 10px">🔔</div><h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px">Alertas Inteligentes</h4><p style="margin: 0; font-size: 14px; color: #475569">Notificaciones inmediatas de movimientos importantes en tus causas</p></div><div class="integration-benefit" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); box-sizing: border-box;"><div style="font-size: 32px; margin-bottom: 10px">📊</div><h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px">Clasificación Automática</h4><p style="margin: 0; font-size: 14px; color: #475569">Organización inteligente de movimientos y documentos judiciales</p></div></div></div><!-- Plan Benefits --><div style="background-color: #f3f4f6; padding: 30px; border-radius: 8px; margin-bottom: 30px"><h3 style="color: #1f2937; margin-top: 0; margin-bottom: 25px; font-size: 22px; text-align: center">Beneficios del Plan STANDARD</h3><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px"><div style="display: flex; align-items: center"><span style="color: #10b981; font-size: 24px; margin-right: 10px; line-height: 1;">✓</span><span style="font-size: 15px;">Sincronización diaria con Poder Judicial</span></div><div style="display: flex; align-items: center"><span style="color: #10b981; font-size: 24px; margin-right: 10px; line-height: 1;">✓</span><span style="font-size: 15px;">Gestión ilimitada de expedientes</span></div><div style="display: flex; align-items: center"><span style="color: #10b981; font-size: 24px; margin-right: 10px; line-height: 1;">✓</span><span style="font-size: 15px;">Alertas personalizables</span></div><div style="display: flex; align-items: center"><span style="color: #10b981; font-size: 24px; margin-right: 10px; line-height: 1;">✓</span><span style="font-size: 15px;">Clasificación automática de movimientos</span></div><div style="display: flex; align-items: center"><span style="color: #10b981; font-size: 24px; margin-right: 10px; line-height: 1;">✓</span><span style="font-size: 15px;">Historial completo de casos</span></div><div style="display: flex; align-items: center"><span style="color: #10b981; font-size: 24px; margin-right: 10px; line-height: 1;">✓</span><span style="font-size: 15px;">Soporte técnico prioritario</span></div><div style="display: flex; align-items: center"><span style="color: #10b981; font-size: 24px; margin-right: 10px; line-height: 1;">✓</span><span style="font-size: 15px;">Búsqueda avanzada en expedientes</span></div><div style="display: flex; align-items: center"><span style="color: #10b981; font-size: 24px; margin-right: 10px; line-height: 1;">✓</span><span style="font-size: 15px;">Respaldo automático diario</span></div></div></div><!-- How It Works --><div style="margin-bottom: 30px;"><h3 style="color: #1f2937; font-size: 20px; margin-bottom: 20px; text-align: center">Cómo funciona la sincronización</h3><div style="background-color: #fff; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px"><div class="integration-step" style="display: flex; align-items: flex-start; margin-bottom: 20px"><div class="step-circle" style="background-color: #3b82f6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 15px; flex-shrink: 0">1</div><div><p style="margin: 0; font-size: 15px;">Conectas tu cuenta del Poder Judicial de forma segura</p></div></div><div class="integration-step" style="display: flex; align-items: flex-start; margin-bottom: 20px"><div class="step-circle" style="background-color: #10b981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 15px; flex-shrink: 0">2</div><div><p style="margin: 0; font-size: 15px;">Importamos automáticamente todos tus expedientes activos</p></div></div><div class="integration-step" style="display: flex; align-items: flex-start; margin-bottom: 20px"><div class="step-circle" style="background-color: #f59e0b; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 15px; flex-shrink: 0">3</div><div><p style="margin: 0; font-size: 15px;">Cada 24 horas actualizamos movimientos y estados</p></div></div><div class="integration-step" style="display: flex; align-items: flex-start;"><div class="step-circle" style="background-color: #8b5cf6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 15px; flex-shrink: 0">4</div><div><p style="margin: 0; font-size: 15px;">Recibes alertas instantáneas de cambios importantes</p></div></div></div></div><!-- Success Metrics --><div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin-bottom: 30px; text-align: center"><h3 style="color: #92400e; margin: 0 0 20px 0; font-size: 20px">Métricas de usuarios STANDARD</h3><div style="display: flex; flex-wrap: wrap; justify-content: space-around; gap: 20px"><div><div style="font-size: 32px; font-weight: 700; color: #d97706">95%</div><p style="font-size: 14px; color: #78350f; margin: 5px 0">Ahorro de tiempo</p></div><div><div style="font-size: 32px; font-weight: 700; color: #d97706">0</div><p style="font-size: 14px; color: #78350f; margin: 5px 0">Plazos perdidos</p></div><div><div style="font-size: 32px; font-weight: 700; color: #d97706">100%</div><p style="font-size: 14px; color: #78350f; margin: 5px 0">Expedientes actualizados</p></div></div></div><!-- Testimonial --><div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; margin-bottom: 30px"><p style="font-style: italic; margin: 0 0 15px 0; font-size: 16px; line-height: 1.6"> "La sincronización diaria con el Poder Judicial transformó mi práctica. Ya no pierdo tiempo consultando manualmente cada expediente. Todo está actualizado y organizado automáticamente." </p><p style="margin: 0; font-weight: 600; text-align: right; color: #059669">— Dr. Roberto Fernández, Especialista en Derecho Civil</p></div><!-- Plan Comparison --><div style="margin-bottom: 30px;"><h3 style="color: #1f2937; font-size: 20px; margin-bottom: 20px; text-align: center">Comparación de planes</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px"><div class="plan-card" style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; text-align: center"><h4 style="margin: 0 0 15px 0; color: #6b7280; font-size: 18px">Plan BÁSICO</h4><p style="font-size: 14px; color: #6b7280; margin: 0 0 20px 0">Sin sincronización judicial</p><ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #6b7280; text-align: left;"><li style="margin-bottom: 10px; display: flex; align-items: center;"><span style="color: #dc2626; margin-right: 8px;">✗</span>Sin conexión Poder Judicial</li><li style="margin-bottom: 10px; display: flex; align-items: center;"><span style="color: #10b981; margin-right: 8px;">✓</span>Gestión manual de casos</li><li style="margin-bottom: 10px; display: flex; align-items: center;"><span style="color: #10b981; margin-right: 8px;">✓</span>Funciones básicas</li></ul></div><div class="plan-card" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 25px; border-radius: 8px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1)"><h4 style="margin: 0 0 15px 0; font-size: 20px">Plan STANDARD</h4><p style="font-size: 16px; margin: 0 0 20px 0; font-weight: 600">Con sincronización judicial</p><ul style="list-style: none; padding: 0; margin: 0; font-size: 15px; text-align: left;"><li style="margin-bottom: 10px; display: flex; align-items: center;"><span style="margin-right: 8px;">✓</span>Sincronización diaria automática</li><li style="margin-bottom: 10px; display: flex; align-items: center;"><span style="margin-right: 8px;">✓</span>Alertas de movimientos</li><li style="margin-bottom: 10px; display: flex; align-items: center;"><span style="margin-right: 8px;">✓</span>Clasificación inteligente</li></ul></div></div></div><!-- CTA Section --><div style="text-align: center; margin-bottom: 30px"><p style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 20px">Activa la sincronización judicial con tu suscripción STANDARD</p><a href="\${process.env.BASE_URL}/upgrade-standard" style="background-color: #3b82f6; color: white; padding: 16px 50px; text-decoration: none; font-weight: 600; border-radius: 8px; display: inline-block; font-size: 18px">Actualizar a STANDARD</a><p style="margin-top: 15px; font-size: 14px; color: #6b7280">Comienza hoy • Configuración inmediata</p></div><!-- Security Note --><div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px"><h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px">🔐 Máxima seguridad garantizada</h4><p style="margin: 0; font-size: 14px; color: #1e293b">Todas las conexiones con el Poder Judicial están encriptadas con SSL/TLS. Cumplimos con los más altos estándares de seguridad y privacidad de datos judiciales.</p></div><!-- Footer --><hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0"><div style="font-size: 13px; color: #6b7280; text-align: center"><p style="margin: 8px 0;">© 2025 Law||Analytics | <a href="mailto:soporte@lawanalytics.app" style="color: #3b82f6; text-decoration: none">soporte@lawanalytics.app</a></p><p style="margin: 8px 0;"><a href="\${process.env.BASE_URL}/privacy-policy" style="color: #3b82f6; text-decoration: none; margin: 0 10px">Privacidad</a><a href="\${process.env.BASE_URL}/terms" style="color: #3b82f6; text-decoration: none; margin: 0 10px">Términos</a><a href="\${process.env.BASE_URL}/unsubscribe?email={{email}}&tag=promotional" style="color: #6b7280; text-decoration: none; margin: 0 10px">Cancelar suscripción</a></p></div></div></body></html>`;

// Update text body too
templates[templateIndex].textBody = `Plan STANDARD
Sincronización diaria con el Poder Judicial de la Nación

Estimado profesional del derecho,

Con nuestra suscripción STANDARD, accedes a la sincronización automática diaria de todos tus expedientes con el Poder Judicial de la Nación. Una sola inversión que transforma completamente tu práctica legal.

🔄 SINCRONIZACIÓN JUDICIAL AUTOMÁTICA
Mantén todos tus expedientes actualizados sin esfuerzo manual

📥 Actualización Diaria
Sincronización automática cada 24 horas de todos tus expedientes

🔔 Alertas Inteligentes
Notificaciones inmediatas de movimientos importantes en tus causas

📊 Clasificación Automática
Organización inteligente de movimientos y documentos judiciales

✅ BENEFICIOS DEL PLAN STANDARD:
• Sincronización diaria con Poder Judicial
• Gestión ilimitada de expedientes
• Alertas personalizables
• Clasificación automática de movimientos
• Historial completo de casos
• Soporte técnico prioritario
• Búsqueda avanzada en expedientes
• Respaldo automático diario

📋 CÓMO FUNCIONA LA SINCRONIZACIÓN:
1. Conectas tu cuenta del Poder Judicial de forma segura
2. Importamos automáticamente todos tus expedientes activos
3. Cada 24 horas actualizamos movimientos y estados
4. Recibes alertas instantáneas de cambios importantes

🎯 MÉTRICAS DE USUARIOS STANDARD:
• 95% Ahorro de tiempo
• 0 Plazos perdidos
• 100% Expedientes actualizados

💬 TESTIMONIAL:
"La sincronización diaria con el Poder Judicial transformó mi práctica. Ya no pierdo tiempo consultando manualmente cada expediente. Todo está actualizado y organizado automáticamente."
— Dr. Roberto Fernández, Especialista en Derecho Civil

📊 COMPARACIÓN DE PLANES:

Plan BÁSICO (Sin sincronización judicial):
✗ Sin conexión Poder Judicial
✓ Gestión manual de casos
✓ Funciones básicas

Plan STANDARD (Con sincronización judicial):
✓ Sincronización diaria automática
✓ Alertas de movimientos
✓ Clasificación inteligente

Activa la sincronización judicial con tu suscripción STANDARD

[Actualizar a STANDARD] \${process.env.BASE_URL}/upgrade-standard

Comienza hoy • Configuración inmediata

🔐 MÁXIMA SEGURIDAD GARANTIZADA:
Todas las conexiones con el Poder Judicial están encriptadas con SSL/TLS. Cumplimos con los más altos estándares de seguridad y privacidad de datos judiciales.

© 2025 Law||Analytics | soporte@lawanalytics.app
Privacidad: \${process.env.BASE_URL}/privacy-policy
Términos: \${process.env.BASE_URL}/terms
Cancelar suscripción: \${process.env.BASE_URL}/unsubscribe?email={{email}}&tag=promotional`;

// Write back to file
fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2), "utf8");

console.log("Template promo_12_judicial_standard_subscription has been successfully updated!");
console.log("Fixed:");
console.log("- Added #222E43 background to judicial logo section");
console.log("- Removed icon next to the logo");
console.log("- Fixed circular numbering (proper width/height)");
console.log('- Removed "Todas las funciones premium"');
console.log("- Fixed check mark alignment (now beside text, not above)");
console.log("- Fixed card cut-off issues in the cards section");
