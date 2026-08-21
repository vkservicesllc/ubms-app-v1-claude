class Vehicle {
  constructor(data) {
    this.id = data.id;
    this.make = data.make;
    this.model = data.model;
    this.year = data.year;
    this.vin = data.vin;
  }

  static list = {
    category: {
      car: ['Passenger Car', 'Standard cars, sedans, hatchbacks'],
      van: ['Van/Minivan', 'Passenger or cargo vans'],
      suv: ['SUV/Crossover', 'Sport Utility Vehicles'],
      pck: ['Pickup Truck', 'Light-duty pickup trucks'],
      ltr: ['Light Truck', 'Commercial trucks ≤ 3.5 t'],
      htr: ['Heavy Truck', 'Commercial trucks > 3.5 t'],
      bus: ['Bus/Coach', 'City buses, coaches, minibuses'],
      trl: ['Trailer/Semi', 'Trailers, semi-trailers'],
      mcy: ['Motorcycle/Moped', 'Two-wheeled vehicles'],
      spc: ['Special Purpose', 'Utility, construction vehicles'],
    },
  };
}

class Truck extends Vehicle {
  constructor(data) {}

  static list = {
    pickupMakeModel: {
      Ford: ['F-250', 'F-350', 'F-450'],
      Ram: ['2500', '3500', '4500'],
      Chevrolet: ['Silverado 2500HD', 'Silverado 3500HD'],
      GMC: ['Sierra 2500HD', 'Sierra 3500HD'],
      Nissan: ['Titan XD'],
      Toyota: ['Tundra'],
    },

    straightBoxMakeModel: {
      Ford: ['F-650 Box', 'F-750 Box'],
      Chevrolet: ['LCF 6500XD'],
      Freightliner: ['M2 106 Box'],
      Kenworth: ['T270 Box'],
      International: ['MV607', 'Durastar 4300'],
      Isuzu: ['NPR-HD', 'NQR', 'FTR'],
      Hino: ['268A', 'L6 Box'],
    },
  };

  // static straightCubeMakeModelList = {
  //     'Ford': ['E-350 Cutaway', 'E-450 Cube'],
  //     'Chevrolet': ['Express Cutaway', '3500 Cube'],
  //     'GMC': ['Savana Cutaway', '3500 Cube'],
  //     'Ram': ['3500 Cutaway'],
  //     'Isuzu': ['N-Series Cutaway'],
  // }

  // static straightDumpMakeModelList = {
  //     'Ford': ['F-550 Dump', 'F-750 Dump'],
  //     'Chevrolet': ['Silverado 6500HD Dump'],
  //     'GMC': ['Sierra 6500HD Dump'],
  //     'Ram': ['5500 Dump'],
  //     'Freightliner': ['M2 106 Dump'],
  //     'International': ['HV607', 'Durastar Dump'],
  //     'Peterbilt': ['337 Dump'],
  //     'Kenworth': ['T370 Dump'],
  // }

  // static straightRollbackMakeModelList = {
  //     'Ford': ['F-550 Rollback', 'F-650 Rollback'],
  //     'Chevrolet': ['Silverado 5500HD Rollback'],
  //     'Ram': ['5500 Rollback'],
  //     'Freightliner': ['M2 106 Rollback'],
  //     'International': ['MV607 Rollback'],
  //     'Hino': ['258 Rollback', 'L7 Rollback'],
  //     'Kenworth': ['T270 Rollback'],
  // }

  // static straightPickupMakeModelList = {
  //     'Ford': ['F-250 Super Duty', 'F-350 Super Duty', 'F-450 Super Duty'],
  //     'Ram': ['2500', '3500', '4500', '5500'],
  //     'Chevrolet': ['Silverado 2500HD', 'Silverado 3500HD'],
  //     'GMC': ['Sierra 2500HD', 'Sierra 3500HD'],
  // }
}

class Trailer extends Vehicle {
  constructor(data) {}
}

class Van extends Vehicle {
  constructor(data) {}

  static list = {
    cargoMakeModel: {
      Ford: ['Transit', 'Transit Connect', 'E-Series'],
      'Mercedes-Benz': ['Sprinter', 'Metris'],
      Freightliner: ['Sprinter'],
      Ram: ['ProMaster', 'ProMaster City'],
      Chevrolet: ['Express 2500', 'Express 3500'],
      GMC: ['Savana 2500', 'Savana 3500'],
      Nissan: ['NV1500', 'NV2500', 'NV3500', 'NV200'],
    },
  };
}

class Bus extends Vehicle {
  constructor(data) {}
}

class Auto extends Vehicle {
  constructor(data) {}
}

export default Vehicle;
export { Truck, Trailer, Van, Bus, Auto };
