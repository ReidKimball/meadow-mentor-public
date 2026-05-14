import React from 'react';
import { Checkbox, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';

const IngredientRow = ({ item, onUpdate, onDelete, onEdit }) => {
  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent row click when deleting
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      background: '#fff',
      customClass: {
        popup: 'z-50' // Ensure it's above other elements if needed
      }
    }).then((result) => {
      if (result.isConfirmed) {
        onDelete(item._id);
      }
    });
  };

  return (
    <div 
      className="flex items-center justify-between p-2 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
      onClick={() => onEdit(item)}
    >
      <div className="flex items-center flex-grow">
        <Checkbox
          checked={item.checked}
          onChange={() => onUpdate(item._id, { checked: !item.checked })}
          onClick={(e) => e.stopPropagation()} // Prevent row click when interacting with checkbox
          className="p-0 mr-3" // Use Tailwind for right margin
        />
        <div className="flex flex-col">
          <span className={`text-gray-800 ${item.checked ? 'line-through text-gray-400' : ''}`}>
            {item.name}
          </span>
          {item.amount && (
            <span className="text-sm text-gray-500">
              {item.amount} {item.unit}
            </span>
          )}
        </div>
      </div>
      <IconButton 
        aria-label="delete" 
        onClick={handleDeleteClick}
      >
        <DeleteIcon />
      </IconButton>
    </div>
  );
};

export default IngredientRow;
