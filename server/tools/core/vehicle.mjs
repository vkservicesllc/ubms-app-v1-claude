class Vehicle {
    constructor(data) {
        this.id = data.id
        this.make = data.make
        this.model = data.model
        this.year = data.year
        this.vin = data.vin
    }


    static vehicleTypeList = {
        //
    }
}


class Truck extends Vehicle {
    constructor(data) {}
}


class Trailer extends Vehicle {
    constructor(data) {}
}


class Van extends Vehicle {
    constructor(data) {}
}


class Bus extends Vehicle {
    constructor(data) {}
}


class Auto extends Vehicle {
    constructor(data) {}
}


export default Vehicle
export { Truck, Trailer, Van, Bus, Auto }