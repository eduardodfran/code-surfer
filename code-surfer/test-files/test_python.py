# Test Python file for Code Surfer analysis
import os
import sys
from typing import List

# This function has several issues for testing
def problematic_function(name, items=[]):  # Mutable default argument
    unused_variable = "This variable is never used"
    
    try:
        result = name % "formatting"  # Old string formatting
        if items == None:  # Should use 'is' instead of '=='
            return []
    except:  # Bare except clause
        pass
    
    return items

class TestClass:
    """A test class for analysis."""
    
    def long_method(self):  # This will be flagged as missing docstring
        # This method will be long to test complexity
        x = 1
        if x > 0:
            if x < 10:
                if x == 5:
                    for i in range(x):
                        if i % 2 == 0:
                            while i > 0:
                                i -= 1
                                if i == 3:
                                    break
        return x

def good_function(name: str, items: List[str] = None) -> List[str]:
    """A well-written function with proper practices."""
    if items is None:
        items = []
    
    result = f"Hello {name}"  # Good string formatting
    
    try:
        processed_items = [item.upper() for item in items]
    except AttributeError as e:
        print(f"Error processing items: {e}")
        processed_items = []
    
    return processed_items