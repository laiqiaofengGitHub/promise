

/*
    仿写一个promise
*/

(function (window) {
    //写在window的原型上, 方便调用
    window.MyPromise = function (callback) {

        //初始化, 定义变量
        var self = this;
        //定义初始状态, 有三种状态, pending正在进行, fulfilled已完成, rejected 失败
        self.status = "pending";
        //定义调用不同状态回调函数传入的参数
        self.resolveValue = null;
        self.rejectValue = null;
        //当callback中有异步执行时, res和rej不会立即执行, 所以不会改变状态
        // 先定义一个数组接收注册的不同状态的回调函数
        self.resolveCallbackArr = [];
        self.rejectCallbackArr = [];
        self.allCount = 0;
        //调用成功回调函数的函数
        function resolve(val, len) {
            if(val === "all") {
                self.allCount ++;
                console.log(self.allCount);
                if(self.allCount == len) {
                    console.log('ihkhjk');
                    self.status = "filfulled";
                    self.resolveValue = val;
                    self.resolveCallbackArr.forEach( (ele) => {
                        ele();
                    })
                }
            }else {
                if(self.status == "pending") {
                    self.status = "fulfilled";
                    self.resolveValue = val;
                    self.resolveCallbackArr.forEach( (ele) => {
                        ele();
                    })
                }
            }
            
        }
        //调用失败回调函数的函数
        function reject (val) {
            if(self.status == "pending") {
                self.status = "rejected";
                self.rejectValue = val;
                self.rejectCallbackArr.forEach( (ele) => {
                    ele();
                })
            }
        }

        //判断是否有错误, 如果有则直接调用失败回调函数
        try {
            callback(resolve, reject);
        }catch(e) {
            reject(e);
        }

    }
    //定义promise的then方法, 以供注册不同状态的回调函数
    MyPromise.prototype.then = function (onFulfilled, onRejected) {
        //如果没写成功回调函数, 直接返回上一个回调函数的返回值
        if(!onFulfilled) {
            onFulfilled = function (val) {
                return val;
            }
        }
        ///如果么有没失败回调函数, 直接返回错误
        if(!onRejected) {
            onRejected = function (val) {
                throw new Error(val);
            }
        }

        var self = this;
        //定义一个新的promise对象, 因为promise的每次链式调用都是返回一个新的promise对象
        var nextPromise = new window.MyPromise( (res, rej) => {
            //把代码写在promise对象的回调函数中
            //1.创建promise对象时的回调函数会同步执行, 不是异步执行
            
            //判断不同状态, 如果为pending表示创建对象时的回调函数为异步执行, 需存储注册的不同作态的回调函数
            switch(self.status) {
                case "fulfilled": 
                //promise.then是异步执行的函数
                setTimeout( () => {
                        try{
                            //2.promise的回调函数的返回值会传递给下一个回调函数,作为参数
                            // 因此要获取上一个回调函数的返回值, 以判断下一个调用那种状态的回调函数
                            var returnValue = onFulfilled(self.resolveValue);
                            //3.回调函数的返回值有很多中情况; 错误, 一个promise对象, 其他非错误的值
                            //因此要对返回值进行判断, 进行不同操作
                            self.dealReturnPromise(nextPromise, returnValue, res, rej);
                        }catch(e) {
                            rej(e);
                        }
                    }, 4);
                    break;
                case "rejected":
                    setTimeout( () => {
                        try{
                            var returnValue = onRejected(self.rejectValue);
                            self.dealReturnPromise(nextPromise, returnValue, res, rej);
                        }catch(e) {
                            rej(e);
                        }
                    }, 4);
                    break;
                case 'pending': 
                    self.resolveCallbackArr.push(function () {
                        setTimeout( () => {
                            try{
                                var returnValue = onFulfilled(self.resolveValue);
                                self.dealReturnPromise(nextPromise, returnValue, res, rej);
                            }catch(e) {
                                rej(e);
                            }
                        }, 4);
                    });
                    self.rejectCallbackArr.push(function () {
                        setTimeout( () => {
                            try{
                                var returnValue = onRejected(self.rejectValue);
                                self.dealReturnPromise(nextPromise, returnValue, res, rej);
                            }catch(e) {
                                rej(e);
                            }
                        }, 4);
                    });
                    break;
                default :
                    break;
            }
        })
        return nextPromise;
    }

    //定义一个catch函数, 专门接受错误, 函数值为新的promise
    MyPromise.prototype.catch = function (onRejected) {
        var self = this;
        var nextPromise = new window.MyPromise( (res, rej) => {
            setTimeout( () => {
                try{
                    var returnValue = onRejected(self.rejectValue);
                    res(returnValue);
                }catch(e) {
                    rej(e);
                }
            }, 4);
        }); 
        return nextPromise; 
    }

    //定义一个dealReturnPromise, 来处理如果返回值为promise的回调函数
    MyPromise.prototype.dealReturnPromise = function (nextPromise, returnValue, res, rej){
        if(returnValue instanceof window.MyPromise) {
            //给为返回值的promise对象注册回回调函数, 以调用在原来的promise注册的回调函数
            returnValue.then(function (val) {
                res(val);
            }, function (val) {
                rej(val);
            })
        }else {
            res(returnValue);
        }
    }

    //定义all方法, 可以传入一个promise对象组成的数组, 返回一个新的promise对象
    // 只有所有的promise对象的成功回调函数被触发时才会触发成功回调函数

    MyPromise.all = function (promiseArr) {
        if(Object.prototype.toString.call(promiseArr) !== "[object Array]"){
            console.log('请传入数组');
            return;
        }

        var len = promiseArr.length;
        console.log(len);
        var nextPromise = new window.MyPromise( (res, rej) => {
            promiseArr.forEach( (ele)  => {
                ele.then(function () {
                    res("all", len);
                }, function () {
                    rej("all", len);
                });
            })
        });
        return nextPromise;
    }

    //定义race方法, 和all方法相似, 传入一个promise对象组成的数组, 返回一个`新的promise对象
    //只要有一个被触发, 那么成功回调函数就会被触发

    MyPromise.race = function (promiseArr) {
        if(Object.prototype.toString.call(promiseArr) !== "[object Array]"){
            console.log('请传入数组');
            return;
        }
        var self = this;

        var nextPromise = new window.MyPromise( (res, rej) => {
            promiseArr.forEach( (ele, index) => {
                // 利用状态只能改变一次的特性, 只要一个触发状态改变就行
                ele.then(res, rej);
            })
        })

        return nextPromise;
        
    }
} (window))