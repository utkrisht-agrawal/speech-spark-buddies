import React, { useEffect, useState } from 'react';

interface AnimatedLipsProps {
  phoneme: string;
  isAnimating?: boolean;
  className?: string;
}

// Map phonemes to realistic mouth images
const phonemeImages: { [key: string]: string } = {
  // Rest/closed position
  'REST': '/mouth_shapes/phoneme_rest1.png',

  // // Vowel sounds
  'AA': '/mouth_shapes/phoneme_o.png',
  'AE': '/mouth_shapes/phoneme_a_i.png',
  'AH0': '/mouth_shapes/phoneme_u.png',
  'AH': '/mouth_shapes/phoneme_u.png',
  'AO': '/mouth_shapes/phoneme_o.png',
  'AW': '/mouth_shapes/phoneme_w_q.png',
  'AY': '/mouth_shapes/phoneme_a_i.png',
  'EH': '/mouth_shapes/phoneme_e.png',
  'ER': '/mouth_shapes/phoneme_u.png',
  'EY': '/mouth_shapes/phoneme_a_i.png',
  'IH': '/mouth_shapes/phoneme_c_d_g_k_n_r_s_y_z.png',
  'IY': '/mouth_shapes/phoneme_e.png',
  'OW': '/mouth_shapes/phoneme_o.png',
  'OY': '/mouth_shapes/phoneme_o.png',
  'UH': '/mouth_shapes/phoneme_u.png',
  'UW': '/mouth_shapes/phoneme_u.png',

  // Consonants
  'B': '/mouth_shapes/phoneme_m_b_p.png',
  'CH': '/mouth_shapes/phoneme_c_d_g_j_k_n_r_s_y_z.png',
  'D': '/mouth_shapes/phoneme_c_d_g_j_k_n_r_s_y_z.png',
  'DH': '/mouth_shapes/phoneme_th.png',
  'F': '/mouth_shapes/phoneme_f_v.png',
  'G': '/mouth_shapes/phoneme_c_d_g_j_k_n_r_s_y_z.png',
  'HH': '/mouth_shapes/phoneme_rest.png',
  'JH': '/mouth_shapes/phoneme_c_d_g_j_k_n_r_s_y_z.png',
  'K': '/mouth_shapes/phoneme_c_d_g_k_n_r_s_y_z.png',
  'L': '/mouth_shapes/phoneme_l.png',
  'M': '/mouth_shapes/phoneme_m_b_p.png',
  'N': '/mouth_shapes/phoneme_c_d_g_j_k_n_r_s_y_z.png',
  'NG': '/mouth_shapes/phoneme_c_d_g_j_k_n_r_s_y_z.png',
  'P': '/mouth_shapes/phoneme_m_b_p.png',
  'R': '/mouth_shapes/phoneme_c_d_g_j_k_n_r_s_y_z.png',
  'S': '/mouth_shapes/phoneme_c_d_g_k_n_r_s_y_z.png',
  'SH': '/mouth_shapes/phoneme_c_d_g_j_k_n_r_s_y_z.png',
  'T': '/mouth_shapes/phoneme_th.png',
  'TH': '/mouth_shapes/phoneme_th.png',
  'V': '/mouth_shapes/phoneme_f_v.png',
  'W': '/mouth_shapes/phoneme_w_q.png',
  'Y': '/mouth_shapes/phoneme_c_d_g_k_n_r_s_y_z.png',
  'Z': '/mouth_shapes/phoneme_c_d_g_k_n_r_s_y_z.png',
  'ZH': '/mouth_shapes/phoneme_c_d_g_j_k_n_r_s_y_z.png',
};

const AnimatedLips: React.FC<AnimatedLipsProps> = ({ 
  phoneme, 
  isAnimating = false, 
  className = "" 
}) => {
  console.log(phoneme);
  const [currentImage, setCurrentImage] = useState(phonemeImages['REST']);

  useEffect(() => {
    // Remove trailing digits (stress markers like AH0, AH1, AH2 → AH)
    const normalizedPhoneme = phoneme.replace(/\d+$/, '');
    const targetImage = phonemeImages[normalizedPhoneme] || phonemeImages['REST'];
    setCurrentImage(targetImage);
  }, [phoneme]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <img 
          src={currentImage}
          alt={`Mouth position for phoneme ${phoneme}`}
          className="w-80 h-60 object-contain rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
};

export default AnimatedLips;
