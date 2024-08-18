class ErrorHandler extends Error{
    statusCode: Number;
    constructor(message:any, statusCode:Number){
       //super method is user to call the constructor of the parent class (erros in this case ). it 
       // it passes themessage argument to the rrros class contructor which sets the error message 
       // for the instance
        super(message)
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor)
    }
}


export default ErrorHandler