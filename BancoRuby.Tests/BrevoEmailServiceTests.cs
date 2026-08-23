using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using BancoCenit.Features.Notifications.Infrastructure.Configuration;
using BancoCenit.Features.Notifications.Infrastructure.Services;
using Microsoft.Extensions.Options;
using Xunit;

namespace BancoRuby.Tests;

public class BrevoEmailServiceTests
{
    private class MockHttpMessageHandler : HttpMessageHandler
    {
        public int CallCount { get; set; }
        public HttpResponseMessage Response { get; set; } = new HttpResponseMessage(HttpStatusCode.OK);

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            return Task.FromResult(Response);
        }
    }

    [Fact]
    public async Task SendEmailAsync_ReturnsTrue_OnSuccessStatusCode()
    {
        // Arrange
        var handler = new MockHttpMessageHandler();
        var client = new HttpClient(handler);
        var options = Options.Create(new BrevoOptions
        {
            ApiKey = "test-key",
            SenderEmail = "sender@test.com",
            SenderName = "Sender"
        });

        var service = new BrevoEmailService(client, options);

        // Act
        var result = await service.SendEmailAsync("test@dest.com", "Dest", "Subject", "Content");

        // Assert
        Assert.True(result);
        Assert.Equal(1, handler.CallCount);
    }

    [Fact]
    public async Task SendEmailAsync_ReturnsFalse_OnFailureStatusCode()
    {
        // Arrange
        var handler = new MockHttpMessageHandler
        {
            Response = new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent("Invalid Request")
            }
        };
        var client = new HttpClient(handler);
        var options = Options.Create(new BrevoOptions
        {
            ApiKey = "test-key",
            SenderEmail = "sender@test.com",
            SenderName = "Sender"
        });

        var service = new BrevoEmailService(client, options);

        // Act
        var result = await service.SendEmailAsync("test@dest.com", "Dest", "Subject", "Content");

        // Assert
        Assert.False(result);
        Assert.Equal(1, handler.CallCount);
    }
}
