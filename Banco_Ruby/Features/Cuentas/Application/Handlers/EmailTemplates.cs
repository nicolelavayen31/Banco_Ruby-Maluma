using System;
using BancoCenit.Features.Cuentas.Domain.Entities;

namespace BancoCenit.Features.Cuentas.Application.Handlers
{
    // Proveedor estÃ¡tico de plantillas de correo electrÃ³nico HTML estructuradas y profesionales para las cuentas.
    public static class EmailTemplates
    {
        public static string BuildDepositHtml(Cuenta cuenta, decimal monto)
        {
            string titularNombre = cuenta.Usuario?.Nombre ?? "Cliente";
            return $@"
                <html>
                    <body style='font-family: Arial, sans-serif; color: #333;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                            <h2 style='color: #2e7d32;'>Banco Ruby - DepÃ³sito Exitoso</h2>
                            <p>Hola, <b>{titularNombre}</b>.</p>
                            <p>Tu cuenta ha recibido un depÃ³sito de efectivo con los siguientes detalles:</p>
                            <table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>NÃºmero de Cuenta:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>{cuenta.NumeroCuenta}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Monto Depositado:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; color: #2e7d32; font-weight: bold;'>${monto:N2}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Saldo Disponible:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>${cuenta.Saldo:N2}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Fecha/Hora:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>{DateTime.Now:dd/MM/yyyy HH:mm:ss}</td>
                                </tr>
                            </table>
                            <br/>
                            <p style='font-size: 12px; color: #777;'>Este es un correo transaccional automÃ¡tico enviado de forma segura por Banco Ruby.</p>
                        </div>
                    </body>
                </html>";
        }

        public static string BuildWithdrawHtml(Cuenta cuenta, decimal monto)
        {
            string titularNombre = cuenta.Usuario?.Nombre ?? "Cliente";
            return $@"
                <html>
                    <body style='font-family: Arial, sans-serif; color: #333;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                            <h2 style='color: #c62828;'>Banco Ruby - Retiro Realizado</h2>
                            <p>Hola, <b>{titularNombre}</b>.</p>
                            <p>Se ha realizado un retiro de efectivo en tu cuenta con los siguientes detalles:</p>
                            <table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>NÃºmero de Cuenta:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>{cuenta.NumeroCuenta}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Monto Retirado:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; color: #c62828; font-weight: bold;'>${monto:N2}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Saldo Disponible:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>${cuenta.Saldo:N2}</td>
                                </tr>
                                <tr>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;'>Fecha/Hora:</td>
                                    <td style='padding: 8px; border-bottom: 1px solid #eee;'>{DateTime.Now:dd/MM/yyyy HH:mm:ss}</td>
                                </tr>
                            </table>
                            <br/>
                            <p style='font-size: 12px; color: #777;'>Este es un correo transaccional automÃ¡tico enviado de forma segura por Banco Ruby.</p>
                        </div>
                    </body>
                </html>";
        }
    }
}
