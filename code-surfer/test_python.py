def bad_function():
    # This function has several issues for Code Surfer to catch
    data = "unused variable"
    
    try:
        result = 10 / 0
    except:  # bare except
        pass
        
    return None

def function_with_mutable_default(items=[]):
    items.append("new item")
    return items

class MyClass:
    def method_without_docstring(self):
        x = 1
        y = 2
        if x > 0:
            if y > 0:
                if x + y > 0:
                    return "deeply nested"