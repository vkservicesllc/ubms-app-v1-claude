export const resetProto = (currentObj = {}, beforeObj = {}, afterObj = {}) => {
    const newObj = { ...beforeObj, ...currentObj, ...afterObj }
    Object.setPrototypeOf(newObj, Object.getPrototypeOf(currentObj))

    return newObj
}


export const reSuper = (currentObj = {}, beforeObj = {}, afterObj = {}) => {
    const reorderedObj = { ...beforeObj, ...currentObj, ...afterObj }

    Object.keys(currentObj).forEach(key => delete currentObj[key])
    Object.assign(currentObj, reorderedObj)

    return currentObj
}