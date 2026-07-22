using Microsoft.AspNetCore.Http;

namespace BancoCenit.Features;

/// <summary>
/// Representa el resultado de una operación de negocio o flujo de aplicación.
/// Sigue el patrón funcional Result para evitar el lanzamiento ineficiente de excepciones de control de flujo.
/// </summary>
/// <typeparam name="T">El tipo del valor retornado en caso de éxito.</typeparam>
public sealed class OperationResult<T>
{
    /// <summary>
    /// Indica si la operación fue exitosa.
    /// </summary>
    public bool IsSuccess { get; }

    /// <summary>
    /// Indica si la operación falló.
    /// </summary>
    public bool IsFailure => !IsSuccess;

    /// <summary>
    /// El valor encapsulado resultante en caso de éxito.
    /// </summary>
    public T? Value { get; }

    /// <summary>
    /// Mensaje de error descriptivo en caso de fallo.
    /// </summary>
    public string? Error { get; }

    /// <summary>
    /// Código de estado HTTP asignado a la respuesta.
    /// </summary>
    public int StatusCode { get; }

    /// <summary>
    /// Constructor privado para inicializar el resultado de la operación.
    /// </summary>
    private OperationResult(bool isSuccess, T? value, string? error, int statusCode)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
        StatusCode = statusCode;
    }

    /// <summary>
    /// Genera un resultado exitoso que contiene el valor especificado.
    /// </summary>
    /// <param name="value">El valor de éxito resultante.</param>
    /// <returns>Instancia exitosa de <see cref="OperationResult{T}"/> con estado HTTP 200 OK.</returns>
    public static OperationResult<T> Ok(T value) => new(true, value, null, StatusCodes.Status200OK);

    /// <summary>
    /// Genera un resultado fallido con estado HTTP 400 Bad Request.
    /// </summary>
    /// <param name="error">La descripción del error.</param>
    /// <returns>Instancia fallida de <see cref="OperationResult{T}"/>.</returns>
    public static OperationResult<T> BadRequest(string error) => new(false, default, error, StatusCodes.Status400BadRequest);

    /// <summary>
    /// Genera un resultado fallido con estado HTTP 404 Not Found.
    /// </summary>
    /// <param name="error">La descripción del recurso no encontrado.</param>
    /// <returns>Instancia fallida de <see cref="OperationResult{T}"/>.</returns>
    public static OperationResult<T> NotFound(string error) => new(false, default, error, StatusCodes.Status404NotFound);

    /// <summary>
    /// Genera un resultado fallido con un código de estado HTTP personalizado.
    /// </summary>
    /// <param name="statusCode">Código de respuesta HTTP.</param>
    /// <param name="error">Descripción del error.</param>
    /// <returns>Instancia fallida personalizada de <see cref="OperationResult{T}"/>.</returns>
    public static OperationResult<T> Fail(int statusCode, string error) => new(false, default, error, statusCode);

    /// <summary>
    /// Transforma sincrónicamente el valor interno utilizando la función de mapeo especificada si la operación fue exitosa.
    /// </summary>
    public OperationResult<U> Map<U>(Func<T, U> mapper)
    {
        return IsSuccess
            ? OperationResult<U>.Ok(mapper(Value!))
            : OperationResult<U>.Fail(StatusCode, Error!);
    }

    /// <summary>
    /// Transforma asíncronamente el valor interno utilizando la función de mapeo especificada si la operación fue exitosa.
    /// </summary>
    public async Task<OperationResult<U>> MapAsync<U>(Func<T, Task<U>> mapper)
    {
        return IsSuccess
            ? OperationResult<U>.Ok(await mapper(Value!))
            : OperationResult<U>.Fail(StatusCode, Error!);
    }

    /// <summary>
    /// Enlaza sincrónicamente la operación actual con otra operación subsiguiente que retorna un <see cref="OperationResult{U}"/>.
    /// </summary>
    public OperationResult<U> Bind<U>(Func<T, OperationResult<U>> binder)
    {
        return IsSuccess
            ? binder(Value!)
            : OperationResult<U>.Fail(StatusCode, Error!);
    }

    /// <summary>
    /// Enlaza asíncronamente la operación actual con otra operación subsiguiente que retorna un <see cref="OperationResult{U}"/>.
    /// </summary>
    public async Task<OperationResult<U>> BindAsync<U>(Func<T, Task<OperationResult<U>>> binder)
    {
        return IsSuccess
            ? await binder(Value!)
            : OperationResult<U>.Fail(StatusCode, Error!);
    }
}

/// <summary>
/// Métodos de extensión para habilitar la fluidez funcional (monádica) sobre tareas asíncronas de <see cref="OperationResult{T}"/>.
/// </summary>
public static class OperationResultExtensions
{
    /// <summary>
    /// Permite encadenar transformaciones asíncronas (Map) sobre tareas asíncronas de resultados de forma directa.
    /// </summary>
    public static async Task<OperationResult<U>> MapAsync<T, U>(this Task<OperationResult<T>> resultTask, Func<T, U> mapper)
    {
        OperationResult<T> result = await resultTask;
        return result.Map(mapper);
    }

    /// <summary>
    /// Permite encadenar enlaces asíncronos (Bind) sobre tareas asíncronas de resultados.
    /// </summary>
    public static async Task<OperationResult<U>> BindAsync<T, U>(this Task<OperationResult<T>> resultTask, Func<T, Task<OperationResult<U>>> binder)
    {
        OperationResult<T> result = await resultTask;
        return await result.BindAsync(binder);
    }
}
