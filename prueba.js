let prueba = () => {
    return new Promise((resolve,reject) => {
        setTimeout(() => {
            resolve('xd')
        }, 0100);
    })
};


module.exports = {prueba};