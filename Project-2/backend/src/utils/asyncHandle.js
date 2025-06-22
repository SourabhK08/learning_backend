const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;

/*
const asyncHandler = () => {}
const asyncHandler = (functionn) => {() => {}}
const asyncHandler = (functionn) => async() => {} // a HOF which takes fn as an arguement

const asyncHandler = (functionn) => async(error,req,res,next) => {
    try {
        await functionn(req,res,next)
    } catch (error) {
        console.log('Error-->',error);
        res.status(error.code || 500).json({
            success:false,
            message:error.message
        })
        
    }
}

*/
