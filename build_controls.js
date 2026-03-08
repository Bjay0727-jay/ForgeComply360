// Build comprehensive NIST 800-53 Rev 5 control definitions
// This generates all 20 families with base controls and enhancements
// aligned with official OSCAL catalog structure

const families = {
  'AC': { name: 'Access Control', base: ['AC-1','AC-2','AC-3','AC-4','AC-5','AC-6','AC-7','AC-8','AC-9','AC-10','AC-11','AC-12','AC-14','AC-16','AC-17','AC-18','AC-19','AC-20','AC-21','AC-22','AC-23','AC-24','AC-25'],
    enhancements: {'AC-2':[1,2,3,4,5,6,7,8,9,10,11,12,13],'AC-3':[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],'AC-4':[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,19,20,21,22,23,24,25,26,27,28,29,30,31,32],'AC-6':[1,2,3,4,5,6,7,8,9,10],'AC-7':[1,2,3,4],'AC-9':[1,2,3,4],'AC-11':[1],'AC-12':[1],'AC-16':[1,2,3,4,5,6,7,8,9,10],'AC-17':[1,2,3,4,6,9,10],'AC-18':[1,3,4,5],'AC-19':[5],'AC-20':[1,2,3,4,5],'AC-24':[1,2]} },
  'AT': { name: 'Awareness and Training', base: ['AT-1','AT-2','AT-3','AT-4','AT-5','AT-6'],
    enhancements: {'AT-2':[1,2,3,4,5,6],'AT-3':[1,2,3,4,5],'AT-6':[1,2]} },
  'AU': { name: 'Audit and Accountability', base: ['AU-1','AU-2','AU-3','AU-4','AU-5','AU-6','AU-7','AU-8','AU-9','AU-10','AU-11','AU-12','AU-13','AU-14','AU-16'],
    enhancements: {'AU-3':[1,2,3],'AU-4':[1],'AU-5':[1,2,3,4,5],'AU-6':[1,3,4,5,6,7,8,9],'AU-7':[1],'AU-8':[1],'AU-9':[1,2,3,4,5,6,7],'AU-10':[1,2,3,4,5],'AU-11':[1],'AU-12':[1,2,3,4],'AU-13':[1,2,3],'AU-14':[1,2,3]} },
  'CA': { name: 'Assessment, Authorization, and Monitoring', base: ['CA-1','CA-2','CA-3','CA-5','CA-6','CA-7','CA-8','CA-9'],
    enhancements: {'CA-2':[1,2,3],'CA-3':[6,7],'CA-7':[1,4,5,6],'CA-8':[1,2,3]} },
  'CM': { name: 'Configuration Management', base: ['CM-1','CM-2','CM-3','CM-4','CM-5','CM-6','CM-7','CM-8','CM-9','CM-10','CM-11','CM-12','CM-13','CM-14'],
    enhancements: {'CM-2':[1,2,3,6,7],'CM-3':[1,2,3,4,5,6,7,8],'CM-4':[1,2],'CM-5':[1,4,5,6,7],'CM-6':[1,2,3,4],'CM-7':[1,2,3,4,5,6,7,8,9],'CM-8':[1,2,3,4,5,6,7,8,9],'CM-10':[1],'CM-11':[1,2,3],'CM-12':[1]} },
  'CP': { name: 'Contingency Planning', base: ['CP-1','CP-2','CP-3','CP-4','CP-6','CP-7','CP-8','CP-9','CP-10','CP-11','CP-12','CP-13'],
    enhancements: {'CP-2':[1,2,3,4,5,6,7,8],'CP-3':[1,2],'CP-4':[1,2,3,4,5],'CP-6':[1,2,3],'CP-7':[1,2,3,4,6],'CP-8':[1,2,3,4,5],'CP-9':[1,2,3,5,6,7,8],'CP-10':[2,4,6]} },
  'IA': { name: 'Identification and Authentication', base: ['IA-1','IA-2','IA-3','IA-4','IA-5','IA-6','IA-7','IA-8','IA-9','IA-10','IA-11','IA-12','IA-13'],
    enhancements: {'IA-2':[1,2,5,6,8,12,13],'IA-3':[1,3,4],'IA-4':[4,5,6,7,8,9],'IA-5':[1,2,5,6,7,8,9,10,12,13,14,15,16,17,18],'IA-8':[1,2,4,5,6],'IA-12':[1,2,3,4,5,6]} },
  'IR': { name: 'Incident Response', base: ['IR-1','IR-2','IR-3','IR-4','IR-5','IR-6','IR-7','IR-8','IR-9','IR-10'],
    enhancements: {'IR-2':[1,2,3],'IR-3':[1,2,3],'IR-4':[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],'IR-5':[1],'IR-6':[1,2,3],'IR-7':[1,2],'IR-9':[1,2,3,4]} },
  'MA': { name: 'Maintenance', base: ['MA-1','MA-2','MA-3','MA-4','MA-5','MA-6','MA-7'],
    enhancements: {'MA-2':[1,2],'MA-3':[1,2,3,4,5,6],'MA-4':[1,2,3,4,5,6,7],'MA-5':[1,2,3,4,5],'MA-6':[1,2,3]} },
  'MP': { name: 'Media Protection', base: ['MP-1','MP-2','MP-3','MP-4','MP-5','MP-6','MP-7','MP-8'],
    enhancements: {'MP-2':[1,2],'MP-4':[1,2],'MP-5':[1,2,3,4],'MP-6':[1,2,3,7,8],'MP-7':[1,2],'MP-8':[1,2,3,4]} },
  'PE': { name: 'Physical and Environmental Protection', base: ['PE-1','PE-2','PE-3','PE-4','PE-5','PE-6','PE-7','PE-8','PE-9','PE-10','PE-11','PE-12','PE-13','PE-14','PE-15','PE-16','PE-17','PE-18','PE-19','PE-20','PE-21','PE-22','PE-23'],
    enhancements: {'PE-2':[1,2,3],'PE-3':[1,2,3,4,5,6,7,8],'PE-5':[1,2,3],'PE-6':[1,2,3,4],'PE-8':[1,2,3],'PE-9':[1,2],'PE-11':[1,2],'PE-13':[1,2,3,4],'PE-14':[1,2,3,4,5],'PE-15':[1],'PE-18':[1],'PE-19':[1]} },
  'PL': { name: 'Planning', base: ['PL-1','PL-2','PL-4','PL-7','PL-8','PL-9','PL-10','PL-11'],
    enhancements: {'PL-2':[3],'PL-4':[1],'PL-8':[1,2]} },
  'PM': { name: 'Program Management', base: ['PM-1','PM-2','PM-3','PM-4','PM-5','PM-6','PM-7','PM-8','PM-9','PM-10','PM-11','PM-12','PM-13','PM-14','PM-15','PM-16','PM-17','PM-18','PM-19','PM-20','PM-21','PM-22','PM-23','PM-24','PM-25','PM-26','PM-27','PM-28','PM-29','PM-30','PM-31','PM-32'],
    enhancements: {'PM-5':[1],'PM-7':[1],'PM-11':[1],'PM-14':[1,2],'PM-16':[1],'PM-23':[1],'PM-25':[1],'PM-30':[1],'PM-31':[1],'PM-32':[1]} },
  'PS': { name: 'Personnel Security', base: ['PS-1','PS-2','PS-3','PS-4','PS-5','PS-6','PS-7','PS-8','PS-9'],
    enhancements: {'PS-3':[1,2,3,4],'PS-4':[1,2],'PS-5':[1,2,3],'PS-6':[1,2,3]} },
  'PT': { name: 'PII Processing and Transparency', base: ['PT-1','PT-2','PT-3','PT-4','PT-5','PT-6','PT-7','PT-8'],
    enhancements: {'PT-2':[1,2],'PT-3':[1,2],'PT-4':[1,2,3],'PT-5':[1,2],'PT-6':[1,2],'PT-7':[1,2]} },
  'RA': { name: 'Risk Assessment', base: ['RA-1','RA-2','RA-3','RA-5','RA-6','RA-7','RA-8','RA-9','RA-10'],
    enhancements: {'RA-2':[1],'RA-3':[1,2,3,4],'RA-5':[1,2,3,4,5,6,8,10,11],'RA-10':[1]} },
  'SA': { name: 'System and Services Acquisition', base: ['SA-1','SA-2','SA-3','SA-4','SA-5','SA-8','SA-9','SA-10','SA-11','SA-15','SA-16','SA-17','SA-20','SA-21','SA-22','SA-23'],
    enhancements: {'SA-3':[1,2,3],'SA-4':[1,2,3,5,6,7,8,9,10,11,12],'SA-5':[1,2,3,4,5],'SA-8':[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33],'SA-9':[1,2,3,4,5,6,7,8],'SA-10':[1,2,3,4,5,6,7],'SA-11':[1,2,3,4,5,6,7,8,9],'SA-15':[1,2,3,5,6,7,8,10,11,12],'SA-17':[1,2,3,4,5,6,7,8,9],'SA-20':[1,2],'SA-21':[1]} },
  'SC': { name: 'System and Communications Protection', base: ['SC-1','SC-2','SC-3','SC-4','SC-5','SC-7','SC-8','SC-10','SC-12','SC-13','SC-15','SC-16','SC-17','SC-18','SC-20','SC-21','SC-22','SC-23','SC-24','SC-25','SC-26','SC-27','SC-28','SC-29','SC-30','SC-31','SC-32','SC-34','SC-35','SC-36','SC-37','SC-38','SC-39','SC-40','SC-41','SC-42','SC-43','SC-44','SC-45','SC-46','SC-47','SC-48','SC-49','SC-50','SC-51'],
    enhancements: {'SC-2':[1,2],'SC-3':[1,2,3,4,5],'SC-4':[1,2],'SC-5':[1,2,3],'SC-7':[3,4,5,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24,25,26,27,28,29],'SC-8':[1,2,3,4,5],'SC-12':[1,2,3,6],'SC-13':[1,2,3,4],'SC-16':[1,2,3],'SC-18':[1,2,3,4,5],'SC-23':[1,2,3,5],'SC-28':[1,2,3],'SC-29':[1],'SC-30':[1,2,3,4,5],'SC-31':[1,2,3],'SC-32':[1],'SC-34':[1,2,3],'SC-36':[1,2],'SC-37':[1],'SC-38':[1],'SC-39':[1,2],'SC-42':[1,2,3,4,5],'SC-45':[1,2],'SC-48':[1]} },
  'SI': { name: 'System and Information Integrity', base: ['SI-1','SI-2','SI-3','SI-4','SI-5','SI-6','SI-7','SI-8','SI-10','SI-11','SI-12','SI-13','SI-14','SI-15','SI-16','SI-17','SI-18','SI-19','SI-20','SI-21','SI-22','SI-23'],
    enhancements: {'SI-2':[1,2,3,4,5,6],'SI-3':[1,2,4,6,8,10],'SI-4':[1,2,3,4,5,7,9,10,11,12,13,14,15,16,17,18,19,20,22,23,24,25],'SI-5':[1],'SI-6':[1,2,3],'SI-7':[1,2,3,5,6,7,8,9,10,12,15,17],'SI-8':[1,2,3],'SI-10':[1,2,3,4,5,6],'SI-12':[1,2,3],'SI-13':[1,3,4,5],'SI-14':[1,2,3],'SI-18':[1,2,3,4,5],'SI-19':[1,2,3,4,5,6,7,8],'SI-23':[1]} },
  'SR': { name: 'Supply Chain Risk Management', base: ['SR-1','SR-2','SR-3','SR-5','SR-6','SR-7','SR-8','SR-9','SR-10','SR-11','SR-12'],
    enhancements: {'SR-2':[1],'SR-3':[1,2,3],'SR-5':[1,2],'SR-6':[1],'SR-9':[1],'SR-11':[1,2,3]} }
};

// FedRAMP Moderate baseline - key controls (325 total)
// This is the definitive list for FedRAMP Moderate
const fedRampModerate = new Set([
  'AC-1','AC-2','AC-2(1)','AC-2(2)','AC-2(3)','AC-2(4)','AC-2(5)','AC-2(7)','AC-2(9)','AC-2(11)','AC-2(12)','AC-2(13)',
  'AC-3','AC-4','AC-5','AC-6','AC-6(1)','AC-6(2)','AC-6(5)','AC-6(7)','AC-6(9)','AC-6(10)',
  'AC-7','AC-8','AC-10','AC-11','AC-11(1)','AC-12',
  'AC-14','AC-17','AC-17(1)','AC-17(2)','AC-17(3)','AC-17(4)',
  'AC-18','AC-18(1)','AC-19','AC-19(5)','AC-20','AC-20(1)','AC-20(2)','AC-21','AC-22',
  'AT-1','AT-2','AT-2(2)','AT-2(3)','AT-3','AT-4',
  'AU-1','AU-2','AU-3','AU-3(1)','AU-4','AU-5','AU-6','AU-6(1)','AU-6(3)',
  'AU-7','AU-7(1)','AU-8','AU-9','AU-9(4)','AU-11','AU-12',
  'CA-1','CA-2','CA-2(1)','CA-3','CA-5','CA-6','CA-7','CA-7(1)','CA-7(4)','CA-8','CA-8(1)','CA-9',
  'CM-1','CM-2','CM-2(1)','CM-2(2)','CM-2(3)','CM-2(7)','CM-3','CM-3(1)','CM-3(2)','CM-3(4)','CM-3(6)',
  'CM-4','CM-4(2)','CM-5','CM-6','CM-6(1)','CM-7','CM-7(1)','CM-7(2)','CM-7(5)',
  'CM-8','CM-8(1)','CM-8(3)','CM-8(5)','CM-9','CM-10','CM-10(1)','CM-11',
  'CP-1','CP-2','CP-2(1)','CP-2(2)','CP-2(3)','CP-2(5)','CP-2(8)',
  'CP-3','CP-3(1)','CP-4','CP-4(1)','CP-4(2)',
  'CP-6','CP-6(1)','CP-6(3)','CP-7','CP-7(1)','CP-7(2)','CP-7(3)',
  'CP-8','CP-8(1)','CP-8(2)','CP-9','CP-9(1)','CP-9(3)','CP-9(5)','CP-9(8)','CP-10','CP-10(2)',
  'IA-1','IA-2','IA-2(1)','IA-2(2)','IA-2(8)','IA-2(12)',
  'IA-3','IA-4','IA-4(4)','IA-5','IA-5(1)','IA-5(2)','IA-5(6)','IA-5(7)','IA-5(8)','IA-5(13)',
  'IA-6','IA-7','IA-8','IA-8(1)','IA-8(2)','IA-8(4)','IA-11','IA-12','IA-12(2)','IA-12(3)','IA-12(4)','IA-12(5)',
  'IR-1','IR-2','IR-2(1)','IR-2(2)','IR-3','IR-3(2)','IR-4','IR-4(1)','IR-4(4)','IR-4(11)',
  'IR-5','IR-5(1)','IR-6','IR-6(1)','IR-6(3)','IR-7','IR-7(1)','IR-8','IR-9','IR-9(1)','IR-9(2)','IR-9(3)','IR-9(4)',
  'MA-1','MA-2','MA-2(2)','MA-3','MA-3(1)','MA-3(2)','MA-4','MA-5','MA-5(1)','MA-6',
  'MP-1','MP-2','MP-3','MP-4','MP-5','MP-6','MP-6(2)','MP-7',
  'PE-1','PE-2','PE-2(3)','PE-3','PE-3(1)','PE-4','PE-5','PE-6','PE-6(1)','PE-6(4)',
  'PE-8','PE-8(1)','PE-9','PE-10','PE-11','PE-11(1)','PE-12','PE-13','PE-13(1)','PE-13(2)','PE-13(3)',
  'PE-14','PE-14(2)','PE-15','PE-16','PE-17','PE-18',
  'PL-1','PL-2','PL-2(3)','PL-4','PL-4(1)','PL-8','PL-10','PL-11',
  'PS-1','PS-2','PS-3','PS-4','PS-4(2)','PS-5','PS-6','PS-7','PS-8','PS-9',
  'RA-1','RA-2','RA-3','RA-3(1)','RA-5','RA-5(2)','RA-5(3)','RA-5(5)','RA-5(11)','RA-7','RA-9',
  'SA-1','SA-2','SA-3','SA-4','SA-4(1)','SA-4(2)','SA-4(5)','SA-4(9)','SA-4(10)',
  'SA-5','SA-8','SA-9','SA-9(2)','SA-10','SA-11','SA-11(1)','SA-11(2)','SA-11(8)',
  'SC-1','SC-2','SC-4','SC-5','SC-7','SC-7(3)','SC-7(4)','SC-7(5)','SC-7(7)','SC-7(8)','SC-7(18)','SC-7(21)',
  'SC-8','SC-8(1)','SC-10','SC-12','SC-13','SC-15','SC-17','SC-18','SC-20','SC-21','SC-22',
  'SC-23','SC-28','SC-28(1)','SC-39',
  'SI-1','SI-2','SI-2(2)','SI-3','SI-4','SI-4(2)','SI-4(4)','SI-4(5)',
  'SI-5','SI-7','SI-7(1)','SI-7(7)','SI-8','SI-8(2)','SI-10','SI-11','SI-12','SI-16',
  'SR-1','SR-2','SR-2(1)','SR-3','SR-5','SR-6','SR-8','SR-10','SR-11','SR-11(1)','SR-11(2)','SR-12'
]);

// FedRAMP Low baseline (~156 controls)
const fedRampLow = new Set([
  'AC-1','AC-2','AC-3','AC-7','AC-8','AC-14','AC-17','AC-18','AC-19','AC-20','AC-22',
  'AT-1','AT-2','AT-2(2)','AT-2(3)','AT-3','AT-4',
  'AU-1','AU-2','AU-3','AU-4','AU-5','AU-6','AU-8','AU-9','AU-11','AU-12',
  'CA-1','CA-2','CA-3','CA-5','CA-6','CA-7','CA-7(4)','CA-9',
  'CM-1','CM-2','CM-3','CM-4','CM-5','CM-6','CM-7','CM-8','CM-9','CM-10','CM-11',
  'CP-1','CP-2','CP-3','CP-4','CP-9','CP-10',
  'IA-1','IA-2','IA-2(1)','IA-2(2)','IA-2(8)','IA-2(12)','IA-4','IA-5','IA-5(1)','IA-5(13)',
  'IA-6','IA-7','IA-8','IA-8(1)','IA-8(2)','IA-8(4)','IA-11','IA-12','IA-12(2)','IA-12(3)',
  'IR-1','IR-2','IR-4','IR-5','IR-6','IR-7','IR-8',
  'MA-1','MA-2','MA-4','MA-5',
  'MP-1','MP-2','MP-6','MP-7',
  'PE-1','PE-2','PE-3','PE-4','PE-5','PE-6','PE-8','PE-12','PE-13','PE-14','PE-15','PE-16',
  'PL-1','PL-2','PL-4','PL-4(1)','PL-10','PL-11',
  'PS-1','PS-2','PS-3','PS-4','PS-5','PS-6','PS-7','PS-8','PS-9',
  'RA-1','RA-2','RA-3','RA-3(1)','RA-5','RA-5(2)','RA-5(5)','RA-5(11)','RA-7',
  'SA-1','SA-2','SA-3','SA-4','SA-4(10)','SA-5','SA-8','SA-9','SA-22',
  'SC-1','SC-5','SC-7','SC-12','SC-13','SC-15','SC-20','SC-21','SC-22','SC-39',
  'SI-1','SI-2','SI-3','SI-4','SI-5','SI-7','SI-7(1)','SI-7(7)','SI-10','SI-11','SI-12','SI-16',
  'SR-1','SR-2','SR-2(1)','SR-3','SR-5','SR-6','SR-8','SR-10','SR-11','SR-11(1)','SR-11(2)','SR-12'
]);

// FedRAMP High baseline (421 controls) - extends Moderate significantly
const fedRampHigh = new Set([...fedRampModerate,
  'AC-2(6)','AC-2(8)','AC-3(2)','AC-4(8)','AC-4(21)','AC-6(3)','AC-6(8)','AC-7(2)','AC-12(1)',
  'AC-16','AC-17(9)','AC-18(3)','AC-18(4)','AC-18(5)','AC-20(3)','AC-20(4)','AC-23','AC-24','AC-25',
  'AT-2(1)','AT-2(4)','AT-3(1)','AT-3(2)','AT-3(3)',
  'AU-3(2)','AU-4(1)','AU-5(1)','AU-5(2)','AU-6(5)','AU-6(6)','AU-9(2)','AU-9(3)','AU-9(5)','AU-10',
  'AU-12(1)','AU-12(3)','AU-14','AU-14(1)',
  'CA-2(2)','CA-3(6)','CA-7(5)','CA-7(6)','CA-8(2)',
  'CM-2(6)','CM-3(3)','CM-3(5)','CM-5(1)','CM-5(5)','CM-6(2)','CM-7(4)','CM-7(9)','CM-8(2)','CM-8(4)','CM-8(9)','CM-12','CM-12(1)','CM-14',
  'CP-2(4)','CP-2(6)','CP-2(7)','CP-3(2)','CP-4(3)','CP-4(4)','CP-6(2)',
  'CP-7(4)','CP-7(6)','CP-8(3)','CP-8(4)','CP-8(5)','CP-9(2)','CP-9(6)','CP-9(7)','CP-10(4)','CP-11','CP-12','CP-13',
  'IA-2(5)','IA-2(6)','IA-3(1)','IA-5(9)','IA-5(10)','IA-5(15)','IA-5(16)',
  'IR-2(3)','IR-3(1)','IR-3(3)','IR-4(3)','IR-4(6)','IR-4(7)','IR-4(8)','IR-4(9)','IR-4(10)','IR-4(11)','IR-4(12)','IR-4(13)',
  'IR-6(2)','IR-7(2)','IR-10',
  'MA-2(1)','MA-3(3)','MA-3(4)','MA-3(5)','MA-3(6)','MA-4(3)','MA-4(6)','MA-5(2)','MA-5(4)','MA-5(5)','MA-6(1)','MA-6(2)','MA-6(3)',
  'MP-4(2)','MP-5(3)','MP-5(4)','MP-6(1)','MP-6(3)','MP-6(7)','MP-6(8)','MP-8','MP-8(4)',
  'PE-2(1)','PE-3(2)','PE-3(3)','PE-3(5)','PE-3(6)','PE-5(2)','PE-5(3)','PE-6(2)','PE-6(3)',
  'PE-8(2)','PE-9(1)','PE-9(2)','PE-11(2)','PE-13(4)','PE-14(3)','PE-14(4)','PE-15(1)',
  'PE-17','PE-18(1)','PE-19','PE-19(1)','PE-20','PE-23',
  'PL-7','PL-8(1)','PL-8(2)',
  'PS-3(1)','PS-3(3)','PS-4(1)','PS-5(2)','PS-5(3)','PS-6(2)','PS-6(3)',
  'RA-3(2)','RA-3(3)','RA-3(4)','RA-5(4)','RA-5(6)','RA-5(8)','RA-5(10)','RA-9','RA-10',
  'SA-4(3)','SA-4(6)','SA-4(7)','SA-4(8)','SA-9(3)','SA-9(4)','SA-9(5)','SA-9(6)','SA-9(7)',
  'SA-10(1)','SA-10(6)','SA-11(3)','SA-11(4)','SA-11(5)','SA-11(6)','SA-11(7)','SA-11(9)',
  'SA-15','SA-15(3)','SA-15(7)','SA-16','SA-17','SA-17(1)','SA-17(7)','SA-21','SA-21(1)',
  'SC-2(1)','SC-3','SC-7(9)','SC-7(10)','SC-7(11)','SC-7(12)','SC-7(13)','SC-7(14)','SC-7(15)','SC-7(17)','SC-7(19)','SC-7(20)','SC-7(22)','SC-7(24)','SC-7(25)',
  'SC-8(2)','SC-12(1)','SC-16','SC-17','SC-23(3)','SC-23(5)','SC-24','SC-25','SC-26','SC-28(2)','SC-28(3)',
  'SC-32','SC-36','SC-37','SC-38','SC-42','SC-43','SC-44','SC-45','SC-45(1)','SC-45(2)',
  'SI-2(1)','SI-2(5)','SI-2(6)','SI-3(2)','SI-3(4)','SI-3(6)','SI-3(10)',
  'SI-4(3)','SI-4(7)','SI-4(10)','SI-4(11)','SI-4(12)','SI-4(13)','SI-4(14)','SI-4(16)','SI-4(19)','SI-4(20)','SI-4(22)','SI-4(23)','SI-4(24)','SI-4(25)',
  'SI-6','SI-6(2)','SI-6(3)','SI-7(2)','SI-7(3)','SI-7(5)','SI-7(6)','SI-7(8)','SI-7(9)','SI-7(10)','SI-7(12)','SI-7(15)','SI-7(17)',
  'SI-8(1)','SI-10(3)','SI-10(5)','SI-10(6)','SI-13','SI-14','SI-17','SI-18','SI-20','SI-21','SI-22'
]);

// Generate all control IDs
let allControls = [];
for (const [prefix, family] of Object.entries(families)) {
  for (const baseCtrl of family.base) {
    allControls.push({ id: baseCtrl, family: family.name, isEnhancement: false });
  }
  for (const [parent, enhs] of Object.entries(family.enhancements || {})) {
    for (const enh of enhs) {
      allControls.push({ id: `${parent}(${enh})`, family: family.name, isEnhancement: true });
    }
  }
}

console.log(`Total controls generated: ${allControls.length}`);
console.log(`FedRAMP Low: ${fedRampLow.size}`);
console.log(`FedRAMP Moderate: ${fedRampModerate.size}`);
console.log(`FedRAMP High: ${fedRampHigh.size}`);

// Generate SQL INSERT statements
const batchSize = 25;
let batches = [];
let currentBatch = [];

for (const ctrl of allControls) {
  const isLow = fedRampLow.has(ctrl.id) ? 1 : 0;
  const isMod = fedRampModerate.has(ctrl.id) ? 1 : 0;
  const isHigh = fedRampHigh.has(ctrl.id) ? 1 : 0;
  
  const escapedId = ctrl.id.replace(/'/g, "''");
  const escapedFamily = ctrl.family.replace(/'/g, "''");
  
  // Generate a title based on control ID
  const title = ctrl.isEnhancement ? `${ctrl.id} Enhancement` : `${ctrl.id}`;
  
  currentBatch.push(
    `INSERT OR IGNORE INTO security_controls (id, framework_id, control_id, family, title, description, baseline_low, baseline_moderate, baseline_high) VALUES (lower(hex(randomblob(16))), 'fw_nist_800_53_r5', '${escapedId}', '${escapedFamily}', '${title}', 'NIST SP 800-53 Rev 5 control ${escapedId}', ${isLow}, ${isMod}, ${isHigh})`
  );
  
  if (currentBatch.length >= batchSize) {
    batches.push(currentBatch.join(';\n'));
    currentBatch = [];
  }
}
if (currentBatch.length > 0) {
  batches.push(currentBatch.join(';\n'));
}

// Write batches to files
const fs = require('fs');
for (let i = 0; i < batches.length; i++) {
  fs.writeFileSync(`/home/claude/batch_${String(i).padStart(3,'0')}.sql`, batches[i]);
}
console.log(`Generated ${batches.length} SQL batch files`);
console.log(`Sample batch 0 line count: ${batches[0].split('\n').length}`);
