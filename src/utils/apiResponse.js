class apiResponse {
    constructor(statusCode, message = "Success", data) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data || null;
        this.success = statusCode >= 200 && statusCode < 300 ? true : false;
    }
}

export { apiResponse };