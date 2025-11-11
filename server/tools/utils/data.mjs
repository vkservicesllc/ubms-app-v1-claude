export default (prop, defValue, fixedType) => {
    let condition = prop === undefined
    if (fixedType && !condition) condition = typeof prop !== fixedType

    return condition ? defValue : prop
}