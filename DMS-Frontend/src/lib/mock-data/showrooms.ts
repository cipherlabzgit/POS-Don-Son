export interface Showroom {
  id: number;
  code: string;
  name: string;
  location: string;
  phone: string;
  manager: string;
  openingTime: string;
  closingTime: string;
  active: boolean;
}

export const mockShowrooms: Showroom[] = [
  { id: 1, code: 'DAL', name: 'Dalmeny', location: 'Colombo 07', phone: '011-2345678', manager: 'John Silva', openingTime: '08:00', closingTime: '20:00', active: true },
  { id: 2, code: 'RAG', name: 'Ragama', location: 'Ragama', phone: '011-2456789', manager: 'Mary Fernando', openingTime: '07:30', closingTime: '19:30', active: true },
  { id: 3, code: 'RAN', name: 'Ranala', location: 'Ranala', phone: '031-2234567', manager: 'Peter Perera', openingTime: '08:00', closingTime: '19:00', active: true },
  { id: 4, code: 'DBQ', name: 'Dehiwala', location: 'Dehiwala', phone: '011-2567890', manager: 'Sarah De Silva', openingTime: '08:00', closingTime: '20:00', active: true },
  { id: 5, code: 'KAD', name: 'Kaduwela', location: 'Kaduwela', phone: '011-2678901', manager: 'David Perera', openingTime: '08:00', closingTime: '19:00', active: true },
  { id: 6, code: 'KEL', name: 'Kelaniya', location: 'Kelaniya', phone: '011-2789012', manager: 'Anita Jayasinghe', openingTime: '07:30', closingTime: '19:30', active: true },
  { id: 7, code: 'KML', name: 'Kirulapone', location: 'Colombo 05', phone: '011-2890123', manager: 'Ravi Kumar', openingTime: '08:00', closingTime: '20:00', active: true },
  { id: 8, code: 'SGK', name: 'Seeduwa', location: 'Seeduwa', phone: '011-2901234', manager: 'Nimal Siriwardena', openingTime: '08:00', closingTime: '19:00', active: true },
  { id: 9, code: 'WED', name: 'Wattala', location: 'Wattala', phone: '011-3012345', manager: 'Sunil Wickramasinghe', openingTime: '08:00', closingTime: '19:30', active: true },
  { id: 10, code: 'MAL', name: 'Malabe', location: 'Malabe', phone: '011-3123456', manager: 'Kamal Dias', openingTime: '08:00', closingTime: '19:00', active: true },
];
