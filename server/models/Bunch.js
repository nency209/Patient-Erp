import mongoose from 'mongoose';

const BunchSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  medicineIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Medicine' 
  }]
}, { timestamps: true });

const Bunch = mongoose.model('Bunch', BunchSchema);
export default Bunch;